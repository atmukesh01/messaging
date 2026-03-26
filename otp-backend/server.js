const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const db = mysql.createPool({
    host: 'localhost', 
    user: 'root',
    password: 'Mukeshmysql1075',
    database: 'network_portal',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

db.getConnection((err, conn) => {
    if (err) {
        console.error("Database Connection Failed:", err.message);
    } else {
        console.log(" Database Connected Successfully (Pool)");
        conn.release();
    }
});

app.get('/', (req, res) => {
    res.send("<h1>Server is LIVE</h1><p>The backend is accessible over your hotspot.</p>");
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: "UP", 
        message: "Connection successful!", 
        serverTime: new Date().toLocaleTimeString() 
    });
});

app.post('/api/register', (req, res) => {
    const { name, mobile, aadhaar, provider } = req.body;
    const checkSql = "SELECT * FROM users WHERE mobile = ? OR aadhaar = ?";
    db.query(checkSql, [mobile, aadhaar], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        if (results.length > 0) return res.status(400).json({ message: "User credentials already exist" });
        
        const prefix = provider === "Jio" ? "63" : provider === "Vi" ? "80" : "98";
        const newNumber = prefix + Math.floor(10000000 + Math.random() * 90000000).toString();
        const customId = name.replace(/\s/g, '').substring(0, 3).toUpperCase() + newNumber.slice(-3);
        
        const sql = "INSERT INTO users (name, mobile, aadhaar, provider, newNumber, customId) VALUES (?, ?, ?, ?, ?, ?)";
        db.query(sql, [name, mobile, aadhaar, provider, newNumber, customId], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ success: true, newNumber, customId });
        });
    });
});

app.post('/api/fetch-number', (req, res) => {
    const { customId } = req.body;
    const sql = "SELECT newNumber FROM users WHERE customId = ?";
    db.query(sql, [customId], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        if (results.length > 0) res.status(200).json({ newNumber: results[0].newNumber });
        else res.status(404).json({ message: "User ID not found" });
    });
});

app.post('/api/setup-pin', (req, res) => {
    const { newNumber, pin, customId, aadhaar } = req.body;
    const sql = "INSERT INTO user_credentials (newNumber, pin, customId, aadhaar) VALUES (?, ?, ?, ?)";
    db.query(sql, [newNumber, pin, customId, aadhaar], (err) => {
        if (err) return res.status(500).json({ message: "PIN Setup Error: " + err.message });
        res.status(200).json({ success: true });
    });
});

app.post('/api/login-number', (req, res) => {
    const { generatedNumber, pin } = req.body;
    const checkCreds = "SELECT * FROM user_credentials WHERE newNumber = ? OR customId = ? OR aadhaar = ?";
    db.query(checkCreds, [generatedNumber, generatedNumber, generatedNumber], (err, credResults) => {
        if (err) return res.status(500).json({ message: err.message });
        
        if (credResults.length > 0) {
            if (pin && credResults[0].pin === pin.toString()) {
                return res.status(200).json({ success: true, user: credResults[0] });
            } else if (!pin) {
                return res.status(200).json({ hasPin: true });
            } else {
                return res.status(401).json({ message: "Entered PIN is wrong" });
            }
        } else {
            const checkUsers = "SELECT newNumber, customId FROM users WHERE newNumber = ? OR customId = ? OR aadhaar = ?";
            db.query(checkUsers, [generatedNumber, generatedNumber, generatedNumber], (err, userResults) => {
                if (err) return res.status(500).json({ message: err.message });
                if (userResults.length > 0) {
                    return res.status(403).json({ 
                        message: "Setup PIN", 
                        newNumber: userResults[0].newNumber, 
                        customId: userResults[0].customId 
                    });
                } else {
                    return res.status(404).json({ message: "User not found" });
                }
            });
        }
    });
});

// UPDATED: Validates recipients exist before sending
app.post('/api/send-sms', (req, res) => {
    const { from, toList, message, scheduledTime } = req.body; 
    const sanitizedList = toList.filter(num => num && num.toString().trim() !== "");
    const recipientsToCheck = sanitizedList.filter(num => num.toString().trim() !== from.toString().trim());

    if (!recipientsToCheck.length) return res.status(400).json({ message: "No valid recipients" });

    // CHECK: Verify recipients are registered in user_credentials
    const checkSql = "SELECT newNumber FROM user_credentials WHERE newNumber IN (?)";
    db.query(checkSql, [recipientsToCheck], (err, results) => {
        if (err) return res.status(500).json({ message: "Validation Error: " + err.message });

        const registeredNumbers = results.map(row => row.newNumber.toString());
        const unRegistered = recipientsToCheck.filter(num => !registeredNumbers.includes(num.toString()));

        if (unRegistered.length > 0) {
            return res.status(400).json({ 
                message: `Failed! The following numbers are not registered on this network: ${unRegistered.join(', ')}` 
            });
        }

        
        let finalTime;
        if (scheduledTime) {
            finalTime = scheduledTime.replace('T', ' ') + ':00';
        } else {
            const now = new Date();
            const options = {
                timeZone: 'Asia/Kolkata',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            };
            const formatter = new Intl.DateTimeFormat('en-GB', options);
            const parts = formatter.formatToParts(now);
            const map = new Map(parts.map(p => [p.type, p.value]));
            finalTime = `${map.get('year')}-${map.get('month')}-${map.get('day')} ${map.get('hour')}:${map.get('minute')}:${map.get('second')}`;
        }

        const sql = "INSERT INTO messages (sender_number, recipient_number, message_text, timestamp) VALUES ?";
        const values = recipientsToCheck.map(to => [from, to, message, finalTime]);

        db.query(sql, [values], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(200).json({ success: true });
        });
    });
});

app.get('/api/inbox/:number', (req, res) => {
    const sql = "SELECT * FROM messages WHERE recipient_number = ? AND recipient_deleted = 0 AND timestamp <= NOW() ORDER BY timestamp DESC";
    db.query(sql, [req.params.number], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching inbox" });
        res.status(200).json(results);
    });
});

app.get('/api/sent/:number', (req, res) => {
    const sql = "SELECT * FROM messages WHERE sender_number = ? AND sender_deleted = 0 AND timestamp <= NOW() ORDER BY timestamp DESC";
    db.query(sql, [req.params.number], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching sent" });
        res.status(200).json(results);
    });
});

app.get('/api/scheduled/:number', (req, res) => {
    const sql = "SELECT *, CASE WHEN timestamp <= NOW() THEN 'Delivered' ELSE 'Pending' END as status FROM messages WHERE sender_number = ? AND sender_deleted = 0 ORDER BY timestamp ASC";
    db.query(sql, [req.params.number], (err, results) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.status(200).json(results);
    });
});

app.get('/api/trash/:number', (req, res) => {
    const sql = "SELECT * FROM messages WHERE (sender_number = ? AND sender_deleted = 1) OR (recipient_number = ? AND recipient_deleted = 1) ORDER BY timestamp DESC";
    db.query(sql, [req.params.number, req.params.number], (err, results) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.status(200).json(results);
    });
});

app.delete('/api/clear-trash/:number', (req, res) => {
    const { number } = req.params;
    const sql = "DELETE FROM messages WHERE (sender_number = ? AND sender_deleted = 1) OR (recipient_number = ? AND recipient_deleted = 1)";
    db.query(sql, [number, number], (err, result) => {
        if (err) return res.status(500).json({ message: "Error clearing trash" });
        res.status(200).json({ success: true, message: "Trash cleared", affectedRows: result.affectedRows });
    });
});

app.post('/api/create-group', (req, res) => {
    const { name, members, creator } = req.body; 
    db.query("INSERT INTO user_groups (group_name, creator_number, members) VALUES (?, ?, ?)", [name, creator, members], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ success: true });
    });
});

app.get('/api/groups/:number', (req, res) => {
    db.query("SELECT * FROM user_groups WHERE creator_number = ?", [req.params.number], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json(results);
    });
});

app.delete('/api/delete-group/:id', (req, res) => {
    db.query("DELETE FROM user_groups WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ success: true });
    });
});

app.post('/api/delete-message', (req, res) => {
    const { messageId, userNumber } = req.body;
    db.query("SELECT sender_number FROM messages WHERE id = ?", [messageId], (err, results) => {
        if (err || !results.length) return res.status(404).json({ message: "Not found" });
        const column = results[0].sender_number === userNumber ? "sender_deleted" : "recipient_deleted";
        db.query(`UPDATE messages SET ${column} = 1 WHERE id = ?`, [messageId], (err) => {
            if (err) return res.status(500).json({ message: "Error" });
            res.status(200).json({ success: true });
        });
    });
});

const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  NETWORK BACKEND RUNNING`);
    console.log(`  Local:    http://localhost:${PORT}`);
    console.log(`  Network:  http://10.41.105.49:${PORT}`);
});
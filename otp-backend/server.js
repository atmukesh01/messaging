const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Mukeshmysql1075',
    database: 'network_portal'
});

db.connect((err) => {
    if (err) console.error(err.message);
    else console.log("Database Connected");
});

app.post('/api/register', (req, res) => {
    const { name, mobile, aadhaar, mac, provider } = req.body;
    const checkSql = "SELECT * FROM users WHERE mobile = ? OR aadhaar = ? OR mac = ?";
    db.query(checkSql, [mobile, aadhaar, mac], (err, results) => {
        if (err) return res.status(500).json({ message: "DB Error" });
        if (results.length > 0) return res.status(400).json({ message: "User exists" });

        const prefix = provider === "Jio" ? "63" : provider === "Vi" ? "80" : "98";
        const newNumber = prefix + Math.floor(10000000 + Math.random() * 90000000).toString();
        const customId = name.replace(/\s/g, '').substring(0, 3).toUpperCase() + newNumber.slice(-3);

        const sql = "INSERT INTO users (name, mobile, aadhaar, mac, provider, newNumber, customId) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(sql, [name, mobile, aadhaar, mac, provider, newNumber, customId], (err) => {
            if (err) return res.status(500).json({ message: "Insert failed" });
            res.status(201).json({ success: true, newNumber, customId });
        });
    });
});

app.post('/api/check-aadhaar-exists', (req, res) => {
    const { aadhaar } = req.body;
    const sql = "SELECT u.name, u.newNumber, u.customId, c.pin FROM users u LEFT JOIN user_credentials c ON u.aadhaar = c.aadhaar WHERE u.aadhaar = ?";
    db.query(sql, [aadhaar], (err, results) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (results.length > 0) {
            res.status(200).json({ 
                user: { name: results[0].name, newNumber: results[0].newNumber, customId: results[0].customId }, 
                hasPin: !!results[0].pin 
            });
        } else res.status(404).json({ message: "Not found" });
    });
});

app.post('/api/fetch-number', (req, res) => {
    const { customId } = req.body;
    const sql = "SELECT newNumber FROM users WHERE customId = ?";
    db.query(sql, [customId], (err, results) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (results.length > 0) {
            res.status(200).json({ success: true, newNumber: results[0].newNumber });
        } else res.status(404).json({ message: "ID not found" });
    });
});

app.post('/api/update-pin', (req, res) => {
    const { aadhaar, pin } = req.body;
    db.query("SELECT newNumber, customId FROM users WHERE aadhaar = ?", [aadhaar], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: "Not found" });
        const { newNumber, customId } = results[0];
        const sql = "INSERT INTO user_credentials (aadhaar, pin, newNumber, customId) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE pin = VALUES(pin)";
        db.query(sql, [aadhaar, pin.toString(), newNumber, customId], (err) => {
            if (err) return res.status(500).json({ message: "Failed" });
            res.status(200).json({ success: true, customId });
        });
    });
});

app.post('/api/login-number', (req, res) => {
    const { generatedNumber, pin } = req.body;

    const checkCreds = "SELECT * FROM user_credentials WHERE newNumber = ? OR customId = ?";
    db.query(checkCreds, [generatedNumber, generatedNumber], (err, credResults) => {
        if (err) return res.status(500).json({ message: "DB Error" });

        if (credResults.length > 0) {
            if (credResults[0].pin === pin.toString()) {
                return res.status(200).json({ success: true, user: credResults[0] });
            } else {
                return res.status(401).json({ message: "Entered PIN is wrong" });
            }
        } else {
            const checkUsers = "SELECT newNumber FROM users WHERE newNumber = ? OR customId = ?";
            db.query(checkUsers, [generatedNumber, generatedNumber], (err, userResults) => {
                if (userResults.length > 0) {
                    return res.status(403).json({ message: "Setup PIN", newNumber: userResults[0].newNumber });
                } else {
                    return res.status(401).json({ message: "User ID or Number not found" });
                }
            });
        }
    });
});

app.post('/api/send-sms', (req, res) => {
    const { from, to, message } = req.body;
    console.log(`SMS Sent from ${from} to ${to}: ${message}`);
    res.status(200).json({ success: true });
});

app.listen(5000, () => console.log("Server running on port 5000"));
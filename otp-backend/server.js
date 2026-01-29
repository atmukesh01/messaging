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
    if (err) console.error("Database connection failed: " + err.message);
    else console.log("Connected to MySQL database.");
});

app.post('/api/register', (req, res) => {
    const { name, mobile, aadhaar, mac, provider } = req.body;
    const checkSql = "SELECT * FROM users WHERE mobile = ? OR aadhaar = ? OR mac = ?";

    db.query(checkSql, [mobile, aadhaar, mac], (err, results) => {
        if (err) return res.status(500).json({ message: "DB Error during check" });
        if (results.length > 0) return res.status(400).json({ message: "User details already exist" });

        let prefix = provider === "Jio" ? "63" : provider === "Vi" ? "80" : "98";
        const newNumber = prefix + Math.floor(10000000 + Math.random() * 90000000);

        const sql = "INSERT INTO users (name, mobile, aadhaar, mac, provider, newNumber) VALUES (?, ?, ?, ?, ?, ?)";
        db.query(sql, [name, mobile, aadhaar, mac, provider, newNumber], (err, result) => {
            if (err) {
                console.error("INSERT ERROR:", err.sqlMessage);
                return res.status(500).json({ message: "Insert failed: " + err.sqlMessage });
            }
            res.status(201).json({ success: true, newNumber });
        });
    });
});

app.post('/api/check-aadhaar-exists', (req, res) => {
    const { aadhaar } = req.body;
    db.query("SELECT name, newNumber FROM users WHERE aadhaar = ?", [aadhaar], (err, results) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        if (results.length > 0) {
            res.status(200).json({ user: results[0] });
        } else {
            res.status(404).json({ message: "Aadhaar not found" });
        }
    });
});

app.post('/api/update-pin', (req, res) => {
    const { aadhaar, pin } = req.body;

    db.query("SELECT newNumber FROM users WHERE aadhaar = ?", [aadhaar], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ message: "Aadhaar not found" });

        const newNumber = results[0].newNumber;
        const sql = "INSERT INTO user_credentials (aadhaar, pin, newNumber) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE pin = ?";
        
        db.query(sql, [aadhaar, pin, newNumber, pin], (err) => {
            if (err) {
                console.error("CREDENTIALS ERROR:", err.sqlMessage);
                return res.status(500).json({ message: "Failed to store PIN: " + err.sqlMessage });
            }
            res.status(200).json({ success: true });
        });
    });
});

app.post('/api/login-number', (req, res) => {
    const { generatedNumber, pin } = req.body;
    const sql = "SELECT * FROM user_credentials WHERE newNumber = ? AND pin = ?";
    
    db.query(sql, [generatedNumber, pin], (err, results) => {
        if (err) return res.status(500).json({ message: "Server error" });
        if (results.length > 0) res.status(200).json({ user: results[0] });
        else res.status(401).json({ message: "Incorrect Number or PIN" });
    });
});

app.post('/api/send-sms', (req, res) => {
    const { from, to, message } = req.body;
    console.log(` SMS LOG | From: ${from} | To: ${to} | Content: ${message}`);
    res.status(200).json({ success: true });
});

app.listen(5000, () => {
    console.log(" Server running on http://localhost:5000");
});
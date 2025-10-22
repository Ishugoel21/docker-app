const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// 1. Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Enable CORS for the frontend running on a different origin (e.g., another container or port)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 2. Database Connection Configuration
// IMPORTANT: Use 'db' as the hostname for Docker Compose networking
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST, 
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
   
});

// 3. Connect and Initialize
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        // Will likely fail here if the DB container isn't up/ready
        return; 
    }
    console.log('Connected to MySQL as id ' + db.threadId);
    
    // Create the table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            value VARCHAR(255) NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log("Table 'submissions' ensured.");
    });
});


// 4. POST Route for Data Submission
app.post('/submit', (req, res) => {
    const { name, value } = req.body;

    if (!name || !value) {
        return res.status(400).json({ message: 'Name and Value are required.' });
    }

    const insertQuery = 'INSERT INTO submissions (name, value) VALUES (?, ?)';
    db.query(insertQuery, [name, value], (err, result) => {
        if (err) {
            console.error('Database insertion error:', err);
            return res.status(500).json({ message: 'Failed to insert data.' });
        }
        console.log(`Data inserted: Name: ${name}, Value: ${value}`);
        res.status(200).json({ 
            message: 'Data submitted successfully!', 
            id: result.insertId,
            data: { name, value } 
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors'); // <-- ADDED: Import the CORS package

const app = express();
const PORT = 3000;

// 1. CORS Configuration
// CRITICAL FIX: The frontend is running on localhost:5500, making it a different origin.
// We must explicitly allow requests from this origin.
const corsOptions = {
    // Only allow requests from the specific frontend origin
    origin: 'http://localhost:5500', 
    methods: 'POST, GET, OPTIONS',
    allowedHeaders: ['Content-Type'],
};

// Apply the CORS middleware
app.use(cors(corsOptions)); 

// 2. Body Parsing Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 3. Database Connection Configuration
// IMPORTANT: Reads configuration from Docker Compose environment variables
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST, 
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

// 4. Connect and Initialize
db.connect(err => {
    if (err) {
        // Log the error and exit the process/return early if DB connection fails
        console.error('Error connecting to MySQL:', err.stack);
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


// 5. POST Route for Data Submission
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

// 6. Root Route (Optional but good for testing access)
app.get('/', (req, res) => {
    res.status(200).send('Node.js Backend is running and CORS is enabled for localhost:5500');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
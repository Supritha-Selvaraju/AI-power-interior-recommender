const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const aiRoutes = require('../scripts/aiRoutes'); // Import the AI route file

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'supritha@04', // Replace with your actual password
    database: 'casaire' // Replace with your actual database name
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting:', err.code); // Get the specific error code
        console.error('Full error:', err);  // Debugging
        return;
    }
    console.log('Connected as id ' + connection.threadId);
});

// Use the AI routes for the "/predict-style" endpoint
app.use('/', aiRoutes);

// Endpoint to fetch decor items based on predicted style
app.get('/api/ai-recommendations', (req, res) => {
    const style = req.query.style || 'neutral'; // Default to 'neutral' if no style is provided
    let tableName;

    // Map style to the correct database table
    switch (style) {
        case 'modern':
            tableName = 'modern_decor';
            break;
        case 'vintage':
            tableName = 'vintage_decor';
            break;
        case 'aesthetic':
            tableName = 'aesthetic_decor';
            break;
        case 'neutral':
            tableName = 'neutral_decor';
            break;
        default:
            tableName = 'neutral_decor'; // Default case if style is not recognized
    }

    const sql = `SELECT item_name, item_image_url FROM ${tableName}`;
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching decor items:', err);
            res.status(500).json({ error: 'Failed to fetch decor items' });
        } else {
            res.json(results);
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

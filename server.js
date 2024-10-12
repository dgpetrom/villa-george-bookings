const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;

// Enable CORS and body parsing
app.use(cors());
app.use(bodyParser.json());

// Set up SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, start_date TEXT, end_date TEXT, name TEXT, email TEXT)");

    // Insert some initial bookings
    db.run("INSERT INTO bookings (start_date, end_date, name, email) VALUES ('2024-06-01', '2024-06-05', 'John Doe', 'john@example.com')");
});

// API to get bookings
app.get('/api/bookings', (req, res) => {
    db.all("SELECT * FROM bookings", (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json(rows);
        }
    });
});

// API to create a new booking
app.post('/api/bookings', (req, res) => {
    const { start_date, end_date, name, email } = req.body;
    db.run("INSERT INTO bookings (start_date, end_date, name, email) VALUES (?, ?, ?, ?)", [start_date, end_date, name, email], function (err) {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.status(201).json({ id: this.lastID });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

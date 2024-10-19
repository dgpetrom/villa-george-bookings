const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51QBgQ1B1SHqUmRkqj964EKsV2TRsneGKk4kwnXQjk6KbE3stSZHyiiRDYmmPkso9mKeuZBPbikNXbAIeqrCzw2kr00nUmTba6Y');  // Add your Stripe secret key here
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

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

// Set up Nodemailer transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dgpetrom@gmail.com', // Your Gmail address
        pass: 'ilaimddmyubvsnup'           // Your Gmail app-specific password or account password
    }
});

// Create a payment intent when a booking is made
app.post('/api/payment', async (req, res) => {
    const { amount, currency, payment_method } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in the smallest currency unit (e.g., cents)
            currency: currency,
            payment_method: payment_method,
            confirm: true
        });

        res.status(200).json({ success: true, paymentIntent });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
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

    // Insert booking into the database
    db.run("INSERT INTO bookings (start_date, end_date, name, email) VALUES (?, ?, ?, ?)",
        [start_date, end_date, name, email],
        function (err) {
            if (err) {
                res.status(500).send(err.message);
            } else {
                // Email to villa owner
                const mailOptionsToOwner = {
                    from: 'dgpetrom@gmail.com',
                    to: 'dgpetrom@gmail.com', // Your email
                    subject: `New Booking from ${name}`,
                    text: `A new booking was made by ${name} from ${start_date} to ${end_date}.\nEmail: ${email}`
                };

                // Email to the person making the booking
                const mailOptionsToUser = {
                    from: 'dgpetrom@gmail.com',
                    to: email, // The user's email
                    subject: 'Booking Confirmation - Villa George',
                    text: `Hi ${name},\n\nThank you for booking your stay at Villa George from ${start_date} to ${end_date}.\n\nWe look forward to your visit!`
                };

                // Send emails
                transporter.sendMail(mailOptionsToOwner, (error, info) => {
                    if (error) {
                        console.error('Error sending email to owner:', error);
                    } else {
                        console.log('Email sent to owner:', info.response);
                    }
                });

                transporter.sendMail(mailOptionsToUser, (error, info) => {
                    if (error) {
                        console.error('Error sending email to user:', error);
                    } else {
                        console.log('Email sent to user:', info.response);
                    }
                });

                res.status(201).json({ id: this.lastID });
            }
        }
    );
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

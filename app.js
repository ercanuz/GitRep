const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// PostgreSQL configuration
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

// Function to write logs to a file
function writeLog(severity, message) {
  const logFilePath = '/data/app.log';
  const timestamp = new Date().toISOString().slice(0, 19);
  const logMessage = `[${timestamp}] [${severity}] ${message}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
}

// Routes
app.get('/', async (req, res) => {
  writeLog('INFO', 'GET request received for /');
  let contacts = [];
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM contacts');
    contacts = result.rows;
    client.release();
  } catch (err) {
    console.error('Error fetching contacts', err);
    writeLog('ERROR', 'Error fetching contacts from database');
  }

  let contactList = contacts.map(contact => `<li>${contact.name} ${contact.surname} - ${contact.title} - ${contact.phonenumber}</li>`).join('');
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Form</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          width: 50%;
          margin: 50px auto;
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        img {
          width: 150px;
          margin-bottom: 20px;
        }
        h2 {
          margin-bottom: 20px;
        }
        form {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        label {
          font-weight: bold;
          display: block;
          text-align: left;
          width: 100%;
        }
        input {
          width: 80%;
          padding: 10px;
          margin: 5px 0 15px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
        input[type="submit"] {
          background-color: #28a745;
          color: white;
          border: none;
          cursor: pointer;
          padding: 10px 15px;
        }
        input[type="submit"]:hover {
          background-color: #218838;
        }
        ul {
          list-style: none;
          padding: 0;
          text-align: left;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="https://via.placeholder.com/150" alt="Company Logo">
        <h2>Contact Form</h2>
        <form action="/submit" method="post">
          <label for="name">Name:</label>
          <input type="text" id="name" name="name" required>
          
          <label for="surname">Surname:</label>
          <input type="text" id="surname" name="surname" required>
          
          <label for="title">Title:</label>
          <input type="text" id="title" name="title">
          
          <label for="phonenumber">Phone Number:</label>
          <input type="text" id="phonenumber" name="phonenumber" required>
          
          <input type="submit" value="Submit">
        </form>
        <h3>Contact List</h3>
        <ul>${contactList}</ul>
      </div>
    </body>
    </html>
  `);
});

app.post('/submit', async (req, res) => {
  const { name, surname, title, phonenumber } = req.body;

  try {
    const client = await pool.connect();
    const query = 'INSERT INTO contacts (name, surname, title, phonenumber) VALUES ($1, $2, $3, $4)';
    const values = [name, surname, title, phonenumber];
    await client.query(query, values);
    client.release();
    writeLog('INFO', 'Data successfully inserted into the database.');
    res.redirect('/');
  } catch (err) {
    console.error('Error executing query', err);
    writeLog('ERROR', 'An error occurred while processing the request.');
    res.redirect('/?error=true');
  }
});

// Start server
app.listen(port, () => {
  console.log(`It is started. Server running on port ${port}`);
});

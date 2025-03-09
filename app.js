const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

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
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT * FROM contacts ORDER BY name ASC');
    contacts = result.rows;
  } catch (err) {
    console.error('Error fetching contacts', err);
    writeLog('ERROR', 'Error fetching contacts from database');
  } finally {
    if (client) client.release();
  }

  let contactList = contacts.map(contact => `
    <tr>
      <td>${contact.name}</td>
      <td>${contact.surname}</td>
      <td>${contact.title}</td>
      <td>${contact.phonenumber}</td>
    </tr>
  `).join('');

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
        h2, h3 {
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
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="/images/logo-1024x288.png" alt="">
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
        <table>
          <tr>
            <th>Name</th>
            <th>Surname</th>
            <th>Title</th>
            <th>Phone Number</th>
          </tr>
          ${contactList}
        </table>
      </div>
    </body>
    </html>
  `);
});

app.post('/submit', async (req, res) => {
  const { name, surname, title, phonenumber } = req.body;
  let client;
  try {
    client = await pool.connect();
    const query = 'INSERT INTO contacts (name, surname, title, phonenumber) VALUES ($1, $2, $3, $4)';
    const values = [name, surname, title, phonenumber];
    await client.query(query, values);
    writeLog('INFO', 'Data successfully inserted into the database.');
    res.redirect('/');
  } catch (err) {
    console.error('Error executing query', err);
    writeLog('ERROR', 'An error occurred while processing the request.');
    res.redirect('/?error=true');
  } finally {
    if (client) client.release();
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
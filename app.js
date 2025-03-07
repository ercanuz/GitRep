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
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM contacts');
    contacts = result.rows;
    client.release();
  } catch (err) {
    console.error('Error fetching contacts', err);
    writeLog('ERROR', 'Error fetching contacts from database');
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
    </head>
    <body>
      <h2>Database Password (Debug Purpose Only)</h2>
      <p>${process.env.DATABASE_PASSWORD}</p>
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
  console.log(`Server running on port ${port}`);
});

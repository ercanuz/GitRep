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
  const logFilePath = '/data/app.log'; // Path to the log file
  const timestamp = new Date().toISOString().slice(0, 19); // Get current timestamp
  const logMessage = `[${timestamp}] [${severity}] ${message}\n`; // Format log message with timestamp and severity

  // Append log message to the log file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
}

// Routes
app.get('/', (req, res) => {
  writeLog('INFO', 'GET request received for /');
  res.send(`
    <form action="/submit" method="post">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name"><br><br>
      <label for="surname">Surname:</label>
      <input type="text" id="surname" name="surname"><br><br>
      <label for="title">Title:</label>
      <input type="text" id="title" name="title"><br><br>
      <label for="phonenumber">Phone Number:</label>
      <input type="text" id="phonenumber" name="phonenumber"><br><br>
      <input type="submit" value="Submit">
      <input type="text" id="test" name="test"><br><br>
    </form>
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
    res.send('Data successfully inserted into the database.');
  } catch (err) {
    console.error('Error executing query', err);
    writeLog('ERROR', 'An error occurred while processing the request.');
    res.status(500).send('An error occurred while processing your request.');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

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
function writeLog(message) {
  const logFilePath = '/data/app.log'; // Path to the log file
  const timestamp = new Date().toISOString(); // Get current timestamp
  const logMessage = `[${timestamp}] ${message}\n`; // Format log message with timestamp

  // Append log message to the log file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
}

app.get('/login', (req, res) => {
  res.send('Login page'); // Send a simple response for now
});
// Routes
app.get('/', (req, res) => {
  writeLog('GET request received for /');
  res.send(`
    <h1>Login</h1>
    <form action="/login" method="post">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username"><br><br>
      <label for="password">Password:</label>
      <input type="password" id="password" name="password"><br><br>
      <input type="submit" value="Login">
    </form>
  `);
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Perform authentication here, for example, querying a database
    // For simplicity, let's assume a hardcoded username and password
    if (username === 'admin' && password === 'password') {
      // Redirect authenticated users to the main page
      res.redirect('/main');
    } else {
      // If authentication fails, render the login page again with an error message
      res.send('<h1>Invalid username or password</h1>');
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('An error occurred during login.');
  }
});

// Main page route
app.get('/main', (req, res) => {
  writeLog('GET request received for /main');
  res.send('<h1>Main Application Page</h1>');
});

// Form submission route
app.post('/submit', async (req, res) => {
  const { name, surname, title, phonenumber } = req.body;

  try {
    const client = await pool.connect();
    const query = 'INSERT INTO contacts (name, surname, title, phonenumber) VALUES ($1, $2, $3, $4)';
    const values = [name, surname, title, phonenumber];
    await client.query(query, values);
    client.release();
    writeLog('Data successfully inserted into the database.');
    res.send('Data successfully inserted into the database.');
  } catch (err) {
    console.error('Error executing query', err);
    writeLog('An error occurred while processing the request.');
    res.status(500).send('An error occurred while processing your request.');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

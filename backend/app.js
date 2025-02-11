const mysql = require('mysql2');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Konfigurasi koneksi ke database MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'internetku',
});

db.connect((err) => {
  if (err) {
    console.error('Koneksi database gagal:', err);
    return;
  }
  console.log('Terhubung ke database!');
});

// API for user login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ message: 'Error comparing passwords' });

            if (isMatch) {
                const token = jwt.sign(
                    { userId: user.user_id, username: user.username },
                    'your_secret_key',
                    { expiresIn: '1h' }
                );
                return res.json({ message: 'Login successful', token });
            } else {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }
        });
    });
});

// API untuk mendaftarkan user berserta paket yang di pilih
// Updated backend registration API
app.post('/api/register', async (req, res) => {
  const { username, password, email, phone, address, package_id, latitude, longitude } = req.body;

  try {
    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
    db.query(checkUserQuery, [email, username], async (err, result) => {
      if (err) throw err;

      if (result.length > 0) {
        return res.status(400).json({ message: 'Email or username already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert into users table with all information
      const insertUserQuery = 'INSERT INTO users (username, password, email, phone_number, package_id, latitude, longitude , address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      db.query(insertUserQuery, [
        username,
        hashedPassword,
        email,
        phone,
        package_id,
        latitude,
        longitude,
        address
      ], (err, userResult) => {
        if (err) throw err;

        res.status(201).json({
          message: 'Pendaftaran berhasil!',
          userId: userResult.insertId
        });
      });
    });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// You can use env vars in real projects
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123', // You should hash this in production!
};

// POST /admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const token = jwt.sign({ role: 'admin' }, 'secret_key', { expiresIn: '1h' });
    return res.json({ message: 'Login successful', token });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

module.exports = router;


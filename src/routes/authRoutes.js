const express = require('express');
const router = express.Router();
const { register, login, getUsers } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../utils/validators');
const { verifyToken } = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/users', verifyToken, getUsers);

module.exports = router;

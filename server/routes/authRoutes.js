const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;

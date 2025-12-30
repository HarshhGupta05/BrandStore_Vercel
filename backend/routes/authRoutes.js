const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    console.log('--- Login Request ---');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    let { email, password } = req.body;

    // Sanitize input
    email = email ? email.trim().toLowerCase() : '';
    password = password ? password.trim() : '';



    try {
        const user = await User.findOne({ email });
        console.log('User found:', user ? user.email : 'No user found');

        if (user) {
            const isMatch = await user.matchPassword(password);
            console.log('Password match:', isMatch);
            console.log('Provided password:', password);
            console.log('Stored hash:', user.password);

            if (isMatch) {
                res.json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    addresses: user.addresses || [],
                    token: generateToken(user._id),
                });
                return;
            }
        }

        console.log('Authentication failed');
        res.status(401).json({ message: 'Invalid email or password' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

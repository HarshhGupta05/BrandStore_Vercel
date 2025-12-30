const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            addresses: user.addresses || [],
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
router.post('/addresses', protect, async (req, res) => {
    const { name, address, city, postalCode, country, phone, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
        const newAddress = {
            name,
            address,
            city,
            postalCode,
            country,
            phone,
            isDefault: isDefault || false,
        };

        // If it's the first address, make it default
        if (user.addresses.length === 0) {
            newAddress.isDefault = true;
        }

        // If new address is default, validation to unset other defaults could be added but for now simple push
        // Actually if isDefault is true, loop others to false
        if (newAddress.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push(newAddress);

        const updatedUser = await user.save();

        res.json(updatedUser.addresses);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Update user profile (legacy support or other fields)
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: req.headers.authorization.split(' ')[1], // Return same token
            addresses: updatedUser.addresses
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

module.exports = router;

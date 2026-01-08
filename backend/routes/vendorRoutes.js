const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private/Admin
router.get('/', async (req, res) => {
    try {
        const vendors = await Vendor.find({}).sort({ createdAt: -1 });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private/Admin
router.post('/', async (req, res) => {
    try {
        const { name, contactPerson, email, phone, address, city, postalCode, country } = req.body;

        const vendor = new Vendor({
            name,
            contactPerson,
            email,
            phone,
            address,
            city,
            postalCode,
            country
        });

        const createdVendor = await vendor.save();
        res.status(201).json(createdVendor);
    } catch (error) {
        console.error("Error creating vendor:", error);
        res.status(400).json({ message: 'Invalid vendor data', error: error.message });
    }
});

module.exports = router;

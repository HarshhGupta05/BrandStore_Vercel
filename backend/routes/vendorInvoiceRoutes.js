const express = require('express');
const router = express.Router();
const VendorInvoice = require('../models/VendorInvoice');

// @desc    Get all invoices
// @route   GET /api/vendor-invoices
// @access  Private/Admin
router.get('/', async (req, res) => {
    try {
        const { status, vendor } = req.query;
        let query = {};

        if (status) query.status = status;
        if (vendor) query.vendorName = { $regex: vendor, $options: 'i' };

        const invoices = await VendorInvoice.find(query).sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get single invoice
// @route   GET /api/vendor-invoices/:id
// @access  Private/Admin
router.get('/:id', async (req, res) => {
    try {
        const invoice = await VendorInvoice.findOne({ invoiceId: req.params.id });
        if (invoice) {
            res.json(invoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update invoice status (Pay)
// @route   PUT /api/vendor-invoices/:id/pay
// @access  Private/Admin
router.put('/:id/pay', async (req, res) => {
    try {
        const invoice = await VendorInvoice.findOne({ invoiceId: req.params.id });
        if (invoice) {
            invoice.status = 'Paid';
            const updatedInvoice = await invoice.save();
            res.json(updatedInvoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating invoice' });
    }
});

module.exports = router;

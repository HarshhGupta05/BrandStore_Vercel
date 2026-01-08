const mongoose = require('mongoose');

const vendorSchema = mongoose.Schema({
    name: { type: String, required: true },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Vendor', vendorSchema);

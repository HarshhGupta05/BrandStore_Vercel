const mongoose = require('mongoose');

const manufacturerOrderSchema = mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    items: [{
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true }, // Quantity Ordered
        quantityReceived: { type: Number, required: true, default: 0 }, // Cached total
        cost: { type: Number, required: true }, // Cost per unit
        deliveries: [{
            receivedQuantity: { type: Number, required: true },
            receivedDate: { type: Date, required: true },
            receivedBy: { type: String } // Optional admin ID
        }]
    }],
    orderDate: { type: Date, required: true },
    expectedArrival: { type: Date, required: true },
    receivingHistory: [{
        productId: { type: String, ref: 'Product' },
        quantityReceived: Number,
        receivedDate: Date,
        costPerUnit: Number
    }],
    status: {
        type: String,
        required: true,
        enum: ['Ordered', 'In Transit', 'Partially Received', 'Received', 'Cancelled'],
        default: 'Ordered'
    },
    totalCost: { type: Number, required: true },
}, {
    timestamps: true,
});

module.exports = mongoose.model('ManufacturerOrder', manufacturerOrderSchema);

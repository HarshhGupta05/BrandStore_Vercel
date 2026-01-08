const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        console.log('--- Order Creation Request ---');
        console.log('Shipping Address Received:', shippingAddress);
        try {
            const order = new Order({
                user: req.user._id,
                orderItems,
                shippingAddress,
                paymentMethod,
                taxPrice,
                shippingPrice,
                totalPrice,
            });

            const createdOrder = await order.save();

            if (req.user) {
                try {
                    // Update legacy address field
                    req.user.address = {
                        address: shippingAddress.address,
                        city: shippingAddress.city,
                        postalCode: shippingAddress.postalCode,
                        country: shippingAddress.country,
                        phone: shippingAddress.phone
                    };
                    req.user.markModified('address');

                    // Add to addresses list if not exists
                    if (!req.user.addresses) {
                        req.user.addresses = [];
                    }

                    const addressExists = req.user.addresses.some(addr =>
                        addr.address === shippingAddress.address &&
                        addr.postalCode === shippingAddress.postalCode
                    );

                    if (!addressExists) {
                        req.user.addresses.push({
                            name: shippingAddress.name || req.user.name,
                            address: shippingAddress.address,
                            city: shippingAddress.city,
                            postalCode: shippingAddress.postalCode,
                            country: shippingAddress.country,
                            phone: shippingAddress.phone,
                            isDefault: req.user.addresses.length === 0
                        });
                    }

                    await req.user.save();
                    console.log('Updated User Address List'); // Logging
                } catch (err) {
                    console.error("Failed to update user address:", err);
                    // Do not fail the order creation if user update fails
                }
            }

            res.status(201).json(createdOrder);
        } catch (error) {
            console.error("Order creation failed:", error);
            res.status(400).json({ message: error.message });
        }
    }
});

router.get('/', protect, async (req, res) => {
    try {
        let orders;
        if (req.user.role === 'admin') {
            orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
        } else {
            orders = await Order.find({ user: req.user._id }).populate('user', 'id name email').sort({ createdAt: -1 });
        }
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (err) {
        res.status(404).json({ message: 'Order not found' });
    }
});

router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (order) {
            if (req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized - Admin only' });
            }

            order.status = status;
            if (status === 'Delivered') {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            }

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            // Check if user owns the order or is admin
            if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized to cancel this order' });
            }

            if (order.status === 'Delivered') {
                return res.status(400).json({ message: 'Cannot cancel delivered order' });
            }

            order.status = 'Cancelled';
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

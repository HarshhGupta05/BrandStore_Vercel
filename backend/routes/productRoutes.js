const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    console.log(`Review submission attempt for product ID: ${productId} by user: ${req.user?._id}`);

    try {
        // Try finding by custom 'id' string first (e.g., "1", "2")
        let product = await Product.findOne({ id: productId });

        // If not found, try finding by MongoDB _id (e.g., "6948dd...")
        if (!product) {
            try {
                // Only try findById if it looks like a valid ObjectId (24 hex characters)
                if (productId.match(/^[0-9a-fA-F]{24}$/)) {
                    product = await Product.findById(productId);
                }
            } catch (e) {
                console.log(`Mongoose error searching for _id: ${productId} - ${e.message}`);
            }
        }

        if (product) {
            console.log(`Product found: ${product.name} (DB _id: ${product._id})`);
            const alreadyReviewed = product.reviews.find(
                (r) => r.userId.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Product already reviewed' });
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                userId: req.user._id,
                productId: product._id,
            };

            product.reviews.push(review);
            product.numReviews = product.reviews.length;
            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Review added' });
        } else {
            console.log(`Product NOT found in DB for ID: ${productId}`);
            res.status(404).json({ message: `Product not found with ID: ${productId}. Please note that orders placed before a database reset may point to deleted product IDs.` });
        }
    } catch (error) {
        console.error('Error in submit review:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

const dummyProducts = [
    {
        id: "1",
        name: "IEM Pink T-Shirt",
        description: "Premium cotton pink t-shirt with IEM branding",
        price: 250,
        category: "Clothing",
        image: "/tshirt-pink.jpg",
        stock: 100,
        manufacturer: "IEM Merch",
        sizes: ["S", "M", "L", "XL"],
    },
    {
        id: "2",
        name: "IEM White T-Shirt",
        description: "Classic white t-shirt with IEM logo",
        price: 250,
        category: "Clothing",
        image: "/tshirt-white.jpg",
        stock: 100,
        manufacturer: "IEM Merch",
        sizes: ["S", "M", "L", "XL"],
    },
    {
        id: "3",
        name: "IEM Green T-Shirt",
        description: "Stylish green t-shirt with IEM branding",
        price: 250,
        category: "Clothing",
        image: "/tshirt-green.jpg",
        stock: 100,
        manufacturer: "IEM Merch",
        sizes: ["S", "M", "L", "XL"],
    },
    {
        id: "4",
        name: "IEM White Bottle",
        description: "Durable white water bottle with IEM logo",
        price: 400,
        category: "Accessories",
        image: "/bottle-white.jpg",
        stock: 50,
        manufacturer: "IEM Merch",
    },
    {
        id: "5",
        name: "IEM Heated Bottle",
        description: "Insulated heated bottle to keep your drinks warm",
        price: 500,
        category: "Accessories",
        image: "/heated-bottle-white.jpg",
        stock: 30,
        manufacturer: "IEM Merch",
    },
    {
        id: "6",
        name: "IEM Mug",
        description: "White ceramic mug with IEM logo",
        price: 150,
        category: "Stationary",
        image: "/iem-mug.jpeg",
        stock: 100,
        manufacturer: "IEM Merch",
    },
    {
        id: "7",
        name: "IEM Pen",
        description: "Premium ballpoint pen with IEM branding",
        price: 80,
        category: "Stationary",
        image: "/iem-pen.jpeg",
        stock: 200,
        manufacturer: "IEM Merch",
    },
    {
        id: "8",
        name: "IEM Giftware Set",
        description: "Complete gift set with notebook, pen and keychain",
        price: 300,
        category: "Stationary",
        image: "/iem-giftware.jpeg",
        stock: 40,
        manufacturer: "IEM Merch",
    },
    {
        id: "9",
        name: "IEM Keychain",
        description: "Metal keychain with IEM logo",
        price: 100,
        category: "Accessories",
        image: "/keychain.jpeg",
        stock: 150,
        manufacturer: "IEM Merch",
    },
];

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const count = await Product.countDocuments({});
        if (count === 0) {
            // Seed initial data
            await Product.insertMany(dummyProducts);
        }

        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

const ManufacturerOrder = require('../models/ManufacturerOrder');

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id }) || await Product.findById(req.params.id).catch(e => null);

        if (product) {
            // Convert to object to allow modification
            const productObj = product.toObject();

            // Find latest manufacturer order for this product
            // We search by productId (custom ID string) stored in order items
            const latestOrder = await ManufacturerOrder.findOne({
                'items.productId': product.id
            })
                .sort({ createdAt: -1 })
                .populate('vendor');

            if (latestOrder && latestOrder.vendor) {
                productObj.manufacturer = latestOrder.vendor.name;
            }

            res.json(productObj);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', async (req, res) => {
    try {
        const { id, name, description, price, category, image, images, stock, manufacturer, sizes } = req.body;

        const product = new Product({
            id: id || `prod-${Date.now()}`,
            name,
            description,
            price,
            category,
            image,
            images,
            stock,
            manufacturer,
            sizes
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Invalid product data', error: error.message });
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', async (req, res) => {
    try {
        const { name, description, price, category, image, images, stock, manufacturer, sizes } = req.body;

        // Try finding by custom 'id' string first, then fallback to _id
        let product = await Product.findOne({ id: req.params.id });
        if (!product) {
            try {
                product = await Product.findById(req.params.id);
            } catch (e) {
                // ignore cast error
            }
        }

        if (product) {
            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price || product.price;
            product.category = category || product.category;
            product.image = image || product.image;
            product.images = images || product.images;
            product.stock = stock !== undefined ? stock : product.stock;
            product.manufacturer = manufacturer || product.manufacturer;
            product.sizes = sizes || product.sizes;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid product data' });
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
    try {
        // Try finding by custom 'id' string first, then fallback to _id
        let product = await Product.findOne({ id: req.params.id });
        if (!product) {
            try {
                product = await Product.findById(req.params.id);
            } catch (e) {
                // ignore cast error
            }
        }

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

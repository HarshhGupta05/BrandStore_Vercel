const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const connectDB = require('./config/db');

dotenv.config();

const inspectDB = async () => {
    try {
        await connectDB();
        const products = await Product.find({});
        console.log('--- PRODUCTS IN DB ---');
        products.forEach(p => {
            console.log(`ID: ${p.id}, Name: ${p.name}, Image: '${p.image}'`);
        });
        console.log('----------------------');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspectDB();

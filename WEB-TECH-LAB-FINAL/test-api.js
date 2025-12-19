// test-api.js
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function testConnection() {
    try {
        await mongoose.connect('mongodb://localhost:27017/golfshop');
        console.log('✅ Connected to MongoDB');
        
        const count = await Product.countDocuments();
        console.log(`📊 Total products in database: ${count}`);
        
        if (count > 0) {
            const products = await Product.find().limit(3);
            console.log('\n📋 Sample products:');
            products.forEach(p => {
                console.log(`- ${p.name}: $${p.price} (${p.category})`);
            });
        }
        
        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testConnection();
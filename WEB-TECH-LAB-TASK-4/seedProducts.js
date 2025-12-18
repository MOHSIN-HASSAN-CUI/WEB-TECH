const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
    {
        name: 'Professional Golf Clubs Set',
        price: 899.99,
        category: 'Clubs',
        image: 'https://images.unsplash.com/photo-1592924688931-7ef8c6e1c3b3?w=400&h=300&fit=crop',
        description: 'Complete 14-piece set with driver, irons, wedges, and putter. Perfect for serious players.',
        stock: 25,
        rating: 4.7,
        reviews: 128,
        featured: true
    },
    {
        name: 'Golf GPS Smart Watch',
        price: 249.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&h=300&fit=crop',
        description: 'Advanced GPS tracking, swing analysis, and 10-day battery life.',
        stock: 50,
        rating: 4.9,
        reviews: 64,
        featured: true
    },
    {
        name: 'Premium Golf Balls (12-pack)',
        price: 49.99,
        category: 'Balls',
        image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop',
        description: 'Tour-level performance with exceptional distance and control.',
        stock: 200,
        rating: 4.5,
        reviews: 89
    },
    {
        name: 'Golf Bag Pro Series',
        price: 199.99,
        category: 'Accessories',
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
        description: '14-way divider, waterproof pockets, and comfortable dual straps.',
        stock: 40,
        rating: 4.4,
        reviews: 42
    },
    {
        name: 'Golf Shoes Waterproof',
        price: 99.99,
        category: 'Shoes',
        image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
        description: 'Spikeless design, all-weather grip, and maximum comfort.',
        stock: 75,
        rating: 4.8,
        reviews: 156,
        featured: true
    },
    {
        name: 'Rangefinder Pro 1000',
        price: 299.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1591134449320-1e3f0df9e7ec?w=400&h=300&fit=crop',
        description: 'Pin-seeking technology with 6x magnification and slope adjustment.',
        stock: 30,
        rating: 4.6,
        reviews: 73
    },
    {
        name: 'Golf Glove Premium',
        price: 24.99,
        category: 'Accessories',
        image: 'https://images.unsplash.com/photo-1592924896448-3eb96079f76a?w=400&h=300&fit=crop',
        description: 'Premium leather glove with enhanced grip and durability.',
        stock: 150,
        rating: 4.3,
        reviews: 87
    },
    {
        name: 'Golf Polo Shirt',
        price: 59.99,
        category: 'Apparel',
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=300&fit=crop',
        description: 'Moisture-wicking fabric with UV protection.',
        stock: 100,
        rating: 4.5,
        reviews: 45
    },
    {
        name: 'Golf Training Mat',
        price: 89.99,
        category: 'Accessories',
        image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop',
        description: 'Portable training mat with realistic turf.',
        stock: 60,
        rating: 4.2,
        reviews: 32
    },
    {
        name: 'Driver Only (Single Club)',
        price: 349.99,
        category: 'Clubs',
        image: 'https://images.unsplash.com/photo-1592924688931-7ef8c6e1c3b3?w=400&h=300&fit=crop',
        description: 'Professional grade driver with adjustable loft.',
        stock: 20,
        rating: 4.7,
        reviews: 58
    },
    {
        name: 'Golf Umbrella',
        price: 34.99,
        category: 'Accessories',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        description: 'Large 68-inch windproof golf umbrella.',
        stock: 80,
        rating: 4.1,
        reviews: 29
    },
    {
        name: 'Golf Hat',
        price: 29.99,
        category: 'Apparel',
        image: 'https://images.unsplash.com/photo-1523380677598-64d85b041e6e?w=400&h=300&fit=crop',
        description: 'Adjustable baseball cap with moisture-wicking band.',
        stock: 120,
        rating: 4.4,
        reviews: 76
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/golfshop');
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert new products
        await Product.insertMany(products);
        console.log(`Inserted ${products.length} products`);

        // Count products by category
        const categoryCounts = await Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        console.log('\nProducts by category:');
        categoryCounts.forEach(cat => {
            console.log(`${cat._id}: ${cat.count} products`);
        });

        mongoose.connection.close();
        console.log('\nDatabase seeding completed!');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
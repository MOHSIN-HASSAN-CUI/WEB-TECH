// Simulated database for products
const products = [
    {
        id: 1,
        name: "Professional Golf Clubs Set",
        price: 899.99,
        category: "Clubs",
        description: "Complete 14-piece set with driver, irons, wedges, and putter.",
        stock: 25,
        image: "https://images.unsplash.com/photo-1592924688931-7ef8c6e1c3b3?w=400&h=300&fit=crop"
    },
    {
        id: 2,
        name: "Golf GPS Smart Watch",
        price: 249.99,
        category: "Electronics",
        description: "Advanced GPS tracking, swing analysis, and 10-day battery life.",
        stock: 50,
        image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&h=300&fit=crop"
    },
    {
        id: 3,
        name: "Premium Golf Balls (12-pack)",
        price: 49.99,
        category: "Balls",
        description: "Tour-level performance with exceptional distance and control.",
        stock: 100,
        image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop"
    }
];

// Model functions
const productModel = {
    // Get all products
    getAllProducts: () => {
        return products;
    },

    // Get product by ID
    getProductById: (id) => {
        return products.find(product => product.id === parseInt(id));
    },

    // Add new product
    addProduct: (productData) => {
        const newProduct = {
            id: products.length + 1,
            ...productData
        };
        products.push(newProduct);
        return newProduct;
    },

    // Update product
    updateProduct: (id, productData) => {
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
            return products[index];
        }
        return null;
    },

    // Delete product
    deleteProduct: (id) => {
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            return products.splice(index, 1)[0];
        }
        return null;
    },

    // Get products by category
    getProductsByCategory: (category) => {
        return products.filter(product => product.category === category);
    },

    // Get featured products (first 3)
    getFeaturedProducts: () => {
        return products.slice(0, 3);
    }
};

module.exports = productModel;
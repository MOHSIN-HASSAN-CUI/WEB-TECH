const Product = require('../models/Product');
const Order = require('../models/Order');

// Home page
exports.getHome = async (req, res) => {
       try {
              const featuredProducts = await Product.find({ featured: true }).limit(3);
              res.render('pages/index', {
                     title: '1GOLF - BeGOLF Home',
                     activePage: 'home',
                     featuredProducts
              });
       } catch (error) {
              console.error('Error fetching featured products:', error);
              res.render('pages/index', {
                     title: '1GOLF - BeGOLF Home',
                     activePage: 'home',
                     featuredProducts: []
              });
       }
};

// Shop page
exports.getShop = async (req, res) => {
       try {
              const page = parseInt(req.query.page) || 1;
              const limit = parseInt(req.query.limit) || 6;
              const skip = (page - 1) * limit;

              const category = req.query.category;
              const minPrice = parseFloat(req.query.minPrice) || 0;
              const maxPrice = parseFloat(req.query.maxPrice) || 10000;
              const sortBy = req.query.sortBy || 'createdAt';
              const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

              const filter = {
                     price: { $gte: minPrice, $lte: maxPrice }
              };

              if (category && category !== 'All') {
                     filter.category = category;
              }

              const categories = await Product.distinct('category');
              const totalProducts = await Product.countDocuments(filter);
              const totalPages = Math.ceil(totalProducts / limit);

              const sort = {};
              sort[sortBy] = sortOrder;

              const products = await Product.find(filter)
                     .sort(sort)
                     .skip(skip)
                     .limit(limit);

              const priceStats = await Product.aggregate([
                     { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
              ]);

              const minPriceOverall = priceStats[0]?.min || 0;
              const maxPriceOverall = priceStats[0]?.max || 1000;

              res.render('pages/products', {
                     title: 'Products - 1GOLF BeGOLF',
                     activePage: 'shop',
                     products,
                     categories,
                     currentCategory: category,
                     currentPage: page,
                     totalPages,
                     totalProducts,
                     limit,
                     minPrice,
                     maxPrice,
                     minPriceOverall,
                     maxPriceOverall,
                     sortBy,
                     sortOrder,
                     hasPrevPage: page > 1,
                     hasNextPage: page < totalPages,
                     prevPage: page > 1 ? page - 1 : null,
                     nextPage: page < totalPages ? page + 1 : null
              });
       } catch (error) {
              console.error('Error fetching products:', error);
              res.render('pages/products', {
                     title: 'Products - 1GOLF BeGOLF',
                     activePage: 'shop',
                     products: [],
                     categories: [],
                     currentPage: 1,
                     totalPages: 1,
                     totalProducts: 0
              });
       }
};

// API endpoint for AJAX requests
exports.getProductsApi = async (req, res) => {
       try {
              const page = parseInt(req.query.page) || 1;
              const limit = parseInt(req.query.limit) || 6;
              const skip = (page - 1) * limit;

              const category = req.query.category;
              const minPrice = parseFloat(req.query.minPrice) || 0;
              const maxPrice = parseFloat(req.query.maxPrice) || 10000;
              const sortBy = req.query.sortBy || 'createdAt';
              const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

              const filter = {
                     price: { $gte: minPrice, $lte: maxPrice }
              };

              if (category && category !== 'All') {
                     filter.category = category;
              }

              const totalProducts = await Product.countDocuments(filter);
              const totalPages = Math.ceil(totalProducts / limit);

              const sort = {};
              sort[sortBy] = sortOrder;

              const products = await Product.find(filter)
                     .sort(sort)
                     .skip(skip)
                     .limit(limit);

              res.json({
                     success: true,
                     products,
                     pagination: {
                            currentPage: page,
                            totalPages,
                            totalProducts,
                            limit,
                            hasPrevPage: page > 1,
                            hasNextPage: page < totalPages,
                            prevPage: page > 1 ? page - 1 : null,
                            nextPage: page < totalPages ? page + 1 : null
                     }
              });
       } catch (error) {
              console.error('API Error:', error);
              res.status(500).json({
                     success: false,
                     message: 'Error fetching products'
              });
       }
};

const Order = require('../models/Order');

// Cart page
exports.getCart = (req, res) => {
       res.render('pages/cart', {
              title: 'Cart - 1GOLF BeGOLF',
              activePage: 'cart'
       });
};

// Checkout page
exports.getCheckout = (req, res) => {
       res.render('pages/checkout', {
              title: 'Checkout - 1GOLF BeGOLF',
              activePage: 'checkout'
       });
};

// Order Preview Route
exports.previewOrder = (req, res) => {
       try {
              const cart = req.session.cart || [];

              if (cart.length === 0) {
                     return res.redirect('/cart');
              }

              let subtotal = 0;
              const itemsWithSubtotals = cart.map(item => {
                     const itemSubtotal = item.price * item.quantity;
                     subtotal += itemSubtotal;
                     return {
                            ...item,
                            subtotal: itemSubtotal
                     };
              });

              const discount = req.discount || 0;
              const discountAmount = subtotal * discount;
              const total = subtotal - discountAmount;

              res.render('pages/order-preview', {
                     title: 'Order Preview - 1GOLF BeGOLF',
                     activePage: 'order',
                     items: itemsWithSubtotals,
                     subtotal: subtotal.toFixed(2),
                     discountAmount: discountAmount.toFixed(2),
                     discountPercent: (discount * 100).toFixed(0),
                     total: total.toFixed(2),
                     couponCode: req.couponCode || '',
                     hasCoupon: !!req.couponCode,
                     couponError: req.couponError || null
              });
       } catch (error) {
              console.error('Order preview error:', error);
              res.redirect('/cart');
       }
};

// Finalize Order Route
exports.placeOrder = async (req, res) => {
       console.log('Received order placement request');
       try {
              const cart = req.session.cart || [];
              console.log('Cart length:', cart.length);

              if (cart.length === 0) {
                     console.log('Cart is empty, redirecting');
                     return res.redirect('/cart');
              }

              const customerEmail = req.body.email || req.session.email || 'guest@example.com';
              console.log('Customer Email:', customerEmail);

              let subtotal = 0;
              const items = cart.map(item => {
                     // Handle legacy cart items that might have 'product' instead of 'name'
                     const itemName = item.name || item.product || 'Unknown Product';
                     const itemQty = item.quantity || 1;
                     const itemPrice = parseFloat(item.price);

                     const itemSubtotal = itemPrice * itemQty;
                     subtotal += itemSubtotal;
                     return {
                            productId: item.productId,
                            name: itemName,
                            price: itemPrice,
                            quantity: itemQty,
                            subtotal: itemSubtotal
                     };
              });

              const discount = req.discount || 0;
              const discountAmount = subtotal * discount;
              const total = subtotal - discountAmount;

              const order = new Order({
                     customerEmail: customerEmail,
                     items: items,
                     subtotal: subtotal,
                     discount: discountAmount,
                     total: total,
                     couponCode: req.couponCode || null,
                     status: 'Placed'
              });

              console.log('Saving order...');
              await order.save();
              console.log('Order saved successfully.');
              console.log('Order ID:', order.orderId);
              console.log('Redirecting to:', `/order/success/${order.orderId}`);

              req.session.cart = [];

              res.redirect(`/order/success/${order.orderId}`);

       } catch (error) {
              console.error('Order placement error DETAILED:', error);
              // Render the error to the user for better feedback
              res.status(500).send(`Error placing order: ${error.message}`);
       }
};

// Handle missing Order ID (Debugging 404)
exports.handleMissingId = (req, res) => {
       console.error('Hit /order/success without ID. Redirecting to home.');
       res.redirect('/');
};

// Order Success Page
exports.getOrderSuccess = async (req, res) => {
       try {
              const order = await Order.findOne({ orderId: req.params.orderId });

              if (!order) {
                     return res.redirect('/');
              }

              res.render('pages/order-success', {
                     title: 'Order Confirmed - 1GOLF BeGOLF',
                     activePage: 'order',
                     order: order
              });
       } catch (error) {
              console.error('Order success page error:', error);
              res.redirect('/');
       }
};

// Customer Order History
exports.getMyOrders = async (req, res) => {
       try {
              // Since user is authenticated, we can fetch orders directly
              const email = req.user.email;

              const orders = await Order.find({ customerEmail: email })
                     .sort({ createdAt: -1 });

              res.render('pages/order-history', {
                     title: 'My Orders - 1GOLF BeGOLF',
                     activePage: 'orders',
                     orders: orders,
                     email: email,
                     error: null
              });
       } catch (error) {
              console.error('Order history error:', error);
              res.render('pages/order-history', {
                     title: 'My Orders - 1GOLF BeGOLF',
                     activePage: 'orders',
                     orders: [],
                     email: req.user.email,
                     error: 'Error fetching orders'
              });
       }
};

// API: Update session cart
exports.updateCartApi = (req, res) => {
       req.session.cart = req.body.cart || [];
       res.json({ success: true });
};

// API: Get cart data
exports.getCartApi = (req, res) => {
       res.json({
              success: true,
              cart: req.session.cart || []
       });
};

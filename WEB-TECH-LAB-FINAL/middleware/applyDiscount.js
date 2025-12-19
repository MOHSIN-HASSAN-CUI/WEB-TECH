const applyDiscount = (req, res, next) => {
    // Check for coupon code in query, body, or session
    let couponCode = req.query.coupon || req.body.coupon;

    // Save to session if present
    if (couponCode && req.session) {
        req.session.coupon = couponCode;
    }

    // fallback to session if not in request
    if (!couponCode && req.session) {
        couponCode = req.session.coupon;
    }

    if (couponCode === 'SAVE10') {
        req.discount = 0.10; // 10% discount
        req.couponCode = 'SAVE10';
        req.couponError = null;
    } else if (couponCode) {
        // Code provided but invalid
        req.discount = 0;
        req.couponCode = null;
        req.couponError = 'Invalid Coupon Code';
        // Clear from session if it was bad
        if (req.session) delete req.session.coupon;
    } else {
        // No code provided
        req.discount = 0;
        req.couponCode = null;
        req.couponError = null;
    }

    next();
};

module.exports = applyDiscount;
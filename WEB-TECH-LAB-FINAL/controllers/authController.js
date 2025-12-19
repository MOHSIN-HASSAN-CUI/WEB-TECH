const User = require('../models/User');

// Register Page
exports.getRegister = (req, res) => {
       // If logged in, redirect to home
       if (req.session.user) return res.redirect('/');

       res.render('pages/register', {
              title: 'Register - 1GOLF BeGOLF',
              activePage: 'register',
              user: null,
              error: req.session.error || null,
              formData: {}
       });
       // Clear temp error from session if single-use
       req.session.error = null;
};

// Register Logic
exports.register = async (req, res) => {
       const { name, email, password, confirmPassword } = req.body;
       let errors = [];

       // Simple Validation
       if (!name || !email || !password || !confirmPassword) {
              errors.push({ msg: 'Please enter all fields' });
       }

       if (password !== confirmPassword) {
              errors.push({ msg: 'Passwords do not match' });
       }

       if (password.length < 6) {
              errors.push({ msg: 'Password must be at least 6 characters' });
       }

       if (errors.length > 0) {
              return res.render('pages/register', {
                     title: 'Register - 1GOLF BeGOLF',
                     activePage: 'register',
                     errors,
                     formData: { name, email, password, confirmPassword },
                     error: null
              });
       }

       try {
              // Check if user exists
              let user = await User.findOne({ email });
              if (user) {
                     return res.render('pages/register', {
                            title: 'Register - 1GOLF BeGOLF',
                            activePage: 'register',
                            errors: [{ msg: 'Email is already registered' }],
                            formData: { name, email, password, confirmPassword },
                            error: null
                     });
              }

              // Create User
              user = new User({
                     name,
                     email,
                     password
              });

              await user.save();

              // Auto login after register? Or redirect to login
              // Let's redirect to login for simplicity
              req.session.success_msg = 'You are now registered and can log in';
              res.redirect('/login');

       } catch (err) {
              console.error(err);
              res.status(500).send('Server Error');
       }
};

// Login Page
exports.getLogin = (req, res) => {
       // If logged in, redirect to home
       if (req.session.user) return res.redirect('/');

       res.render('pages/login', {
              title: 'Login - 1GOLF BeGOLF',
              activePage: 'login',
              user: null, // explicitly passed
              error: req.session.error || null
       });
       req.session.error = null;
};

// Login Logic
exports.login = async (req, res) => {
       const { email, password } = req.body;

       try {
              // Check user
              const user = await User.findOne({ email });
              if (!user) {
                     return res.render('pages/login', {
                            title: 'Login - 1GOLF BeGOLF',
                            activePage: 'login',
                            error: 'Invalid credentials',
                            email: email
                     });
              }

              // Check password
              const isMatch = await user.matchPassword(password);
              if (!isMatch) {
                     return res.render('pages/login', {
                            title: 'Login - 1GOLF BeGOLF',
                            activePage: 'login',
                            error: 'Invalid credentials',
                            email: email
                     });
              }

              // BLOCK ADMINS from regular login
              if (user.isAdmin) {
                     return res.render('pages/login', {
                            title: 'Login - 1GOLF BeGOLF',
                            activePage: 'login',
                            error: 'Admin login must be done via the Admin Portal',
                            email: email
                     });
              }

              // Login success - Set session
              // Only saving minimal necessary info
              req.session.user = {
                     _id: user._id,
                     name: user.name,
                     email: user.email,
                     isAdmin: user.isAdmin
              };

              // Redirect to previous page or home
              const returnTo = req.session.returnTo || '/';
              delete req.session.returnTo;

              res.redirect(returnTo);

       } catch (err) {
              console.error(err);
              res.status(500).send('Server Error');
       }
};

// Admin Login Page
exports.getAdminLogin = (req, res) => {
       if (req.session.user && req.session.user.isAdmin) return res.redirect('/admin/dashboard');

       res.render('pages/admin-login', {
              title: 'Admin Login - 1GOLF BeGOLF',
              activePage: 'admin',
              // user property removed to let res.locals.user take precedence
              error: req.session.error || null
       });
       req.session.error = null;
};

// Admin Login Logic
exports.adminLogin = async (req, res) => {
       const { email, password } = req.body;
       try {
              const user = await User.findOne({ email });
              if (!user || !(await user.matchPassword(password))) {
                     return res.render('pages/admin-login', {
                            title: 'Admin Login',
                            activePage: 'admin',
                            error: 'Invalid Admin Credentials',
                            email: email
                            // user property removed to let res.locals.user take precedence
                     });
              }

              if (!user.isAdmin) {
                     return res.render('pages/admin-login', {
                            title: 'Admin Login',
                            activePage: 'admin',
                            error: 'Access Denied: Not an Administrator',
                            email: email
                            // user property removed to let res.locals.user take precedence
                     });
              }

              req.session.user = {
                     _id: user._id,
                     name: user.name,
                     email: user.email,
                     isAdmin: user.isAdmin
              };

              res.redirect('/admin/dashboard');
       } catch (err) {
              console.error(err);
              res.status(500).send('Server Error');
       }
};

// Admin Logout
exports.adminLogout = (req, res) => {
       req.session.destroy((err) => {
              if (err) console.log(err);
              // Explicitly redirect to admin login
              res.redirect('/admin/login');
       });
};

// Regular Logout
exports.logout = (req, res) => {
       req.session.destroy((err) => {
              if (err) console.log(err);
              res.redirect('/login');
       });
};

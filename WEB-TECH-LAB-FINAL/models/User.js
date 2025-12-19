const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
       name: {
              type: String,
              required: [true, 'Please enter your name'],
              trim: true
       },
       email: {
              type: String,
              required: [true, 'Please enter your email'],
              unique: true,
              trim: true,
              lowercase: true,
              match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
       },
       password: {
              type: String,
              required: [true, 'Please enter a password'],
              minlength: [6, 'Minimum password length is 6 characters']
       },
       isAdmin: {
              type: Boolean,
              default: false
       },
       createdAt: {
              type: Date,
              default: Date.now
       }
});

// Encrypt password before saving
userSchema.pre('save', async function () {
       if (!this.isModified('password')) {
              return;
       }
       const salt = await bcrypt.genSalt(10);
       this.password = await bcrypt.hash(this.password, salt);
});

// Compare user password
userSchema.methods.matchPassword = async function (enteredPassword) {
       return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

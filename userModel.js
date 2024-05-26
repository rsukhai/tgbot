const mongoose = require('mongoose');

// Підключення до MongoDB Atlas
const uri = 'mongodb+srv://Asstro699:12345qwerty@cluster0.lnr9qbv.mongodb.net/Web?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: String,
  firstName: String,
  lastName: String,
  registeredAt: { type: Date, default: Date.now }
});

// Вказуємо колекцію 'users'
const User = mongoose.model('User', userSchema, 'users');

module.exports = User;

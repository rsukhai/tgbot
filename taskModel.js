const mongoose = require('mongoose');

const uri = 'mongodb+srv://Asstro699:12345qwerty@cluster0.lnr9qbv.mongodb.net/Web?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const taskSchema = new mongoose.Schema({
  userId: String,
  text: String,
  dueDate: Date,
  remind: { type: Boolean, default: false },
  remindFrequency: String, // Наприклад, "daily", "weekly", "monthly", "yearly"
  lastReminder: Date,
  category: String, // Додавання категорії
  priority: String // Додавання пріоритету
});

const Task = mongoose.model('Task', taskSchema, 'list');

module.exports = Task;

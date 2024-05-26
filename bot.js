const token = '7014669903:AAE4oAaqh5we2Pyn3Vp5F3mxRwQX8rIPouI';
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const Task = require('./taskModel');
const User = require('./userModel'); // Підключення моделі користувача

const bot = new TelegramBot(token, { polling: true });

// Збереження стану користувачів
const userStates = {};
const userTasks = {};
const userDateRanges = {};

// Обробка помилок опитування
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Функція для відображення головного меню
const showMainMenu = (chatId) => {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Переглянути завдання', callback_data: 'view_tasks' },
            { text: 'Додати завдання', callback_data: 'add_task' },
            { text: 'Видалити завдання', callback_data: 'delete_task' }
          ],
          [
            { text: 'Фільтрувати завдання', callback_data: 'filter_tasks' },
            { text: 'Редагувати категорію', callback_data: 'edit_category' },
            { text: 'Редагувати пріоритет', callback_data: 'edit_priority' }
          ]
        ]
      }
    };
  
    bot.sendMessage(chatId, 'Виберіть опцію:', opts);
  };
// Команда для відображення кнопок
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Реєстрація користувача, якщо він ще не зареєстрований
  const existingUser = await User.findOne({ telegramId: msg.from.id.toString() });
  if (!existingUser) {
    const newUser = new User({
      telegramId: msg.from.id.toString(),
      username: msg.from.username,
      firstName: msg.from.first_name,
      lastName: msg.from.last_name
    });

    await newUser.save()
      .then(() => {
        bot.sendMessage(chatId, 'Ви успішно зареєстровані!');
      })
      .catch(err => {
        bot.sendMessage(chatId, 'Виникла помилка при реєстрації.');
        console.error(err);
      });
  } else {
    bot.sendMessage(chatId, 'Ви вже зареєстровані.');
  }

  showMainMenu(chatId);
});

bot.onText(/\/addcategory (\d+) (.+)/, async (msg, match) => {
  const taskIndex = parseInt(match[1], 10) - 1;
  const category = match[2];
  const chatId = msg.chat.id;

  if (!userTasks[chatId] || !userTasks[chatId][taskIndex]) {
    bot.sendMessage(chatId, 'Завдання не знайдено.');
    return;
  }

  const taskId = userTasks[chatId][taskIndex]._id;

  try {
    const task = await Task.findById(taskId);
    task.category = category;
    await task.save();
    bot.sendMessage(chatId, 'Категорію успішно додано.');
  } catch (err) {
    bot.sendMessage(chatId, 'Не вдалося додати категорію.');
    console.error(err);
  }
});

bot.onText(/\/filtercategory (.+)/, async (msg, match) => {
  const category = match[1];
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const tasks = await Task.find({ userId: userId, category: category });
    if (tasks.length > 0) {
      let message = tasks.map((task, index) => `${index + 1}: ${task.text} до ${task.dueDate.toISOString().substring(0, 10)} (${task.category})`).join('\n');
      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, 'Завдання не знайдені.');
    }
  } catch (err) {
    bot.sendMessage(chatId, 'Не вдалося отримати список завдань.');
    console.error(err);
  }
});

bot.onText(/\/addpriority (\d+) (.+)/, async (msg, match) => {
  const taskIndex = parseInt(match[1], 10) - 1;
  const priority = match[2];
  const chatId = msg.chat.id;

  if (!userTasks[chatId] || !userTasks[chatId][taskIndex]) {
    bot.sendMessage(chatId, 'Завдання не знайдено.');
    return;
  }

  const taskId = userTasks[chatId][taskIndex]._id;

  try {
    const task = await Task.findById(taskId);
    task.priority = priority;
    await task.save();
    bot.sendMessage(chatId, 'Пріоритет успішно додано.');
  } catch (err) {
    bot.sendMessage(chatId, 'Не вдалося додати пріоритет.');
    console.error(err);
  }
});

bot.onText(/\/filterpriority (.+)/, async (msg, match) => {
  const priority = match[1];
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const tasks = await Task.find({ userId: userId, priority: priority });
    if (tasks.length > 0) {
      let message = tasks.map((task, index) => `${index + 1}: ${task.text} до ${task.dueDate.toISOString().substring(0, 10)} (Пріоритет: ${task.priority})`).join('\n');
      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, 'Завдання не знайдені.');
    }
  } catch (err) {
    bot.sendMessage(chatId, 'Не вдалося отримати список завдань.');
    console.error(err);
  }
});

bot.onText(/\/edit (\d+) (.+)/, async (msg, match) => {
  const taskIndex = parseInt(match[1], 10) - 1;
  const newText = match[2];
  const chatId = msg.chat.id;

  if (!userTasks[chatId] || !userTasks[chatId][taskIndex]) {
    bot.sendMessage(chatId, 'Завдання не знайдено.');
    return;
  }

  const taskId = userTasks[chatId][taskIndex]._id;

  try {
    const task = await Task.findById(taskId);
    task.text = newText;
    await task.save();
    bot.sendMessage(chatId, 'Завдання успішно оновлено.');
  } catch (err) {
    bot.sendMessage(chatId, 'Не вдалося оновити завдання.');
    console.error(err);
  }
});

bot.onText(/\/delete (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const taskId = match[1];

  try {
    await Task.findByIdAndDelete(taskId);
    bot.sendMessage(userId, 'Завдання успішно видалено.');
  } catch (err) {
    bot.sendMessage(userId, 'Не вдалося видалити завдання.');
    console.error(err);
  }
});

bot.onText(/\/list/, async (msg) => {
  const userId = msg.from.id;

  Task.find({ userId: userId }).then(tasks => {
    if (tasks.length > 0) {
      let message = tasks.map((task, index) => `${index + 1}: ${task.text} до ${task.dueDate.toISOString().substring(0, 10)}`).join('\n');
      bot.sendMessage(userId, message);
    } else {
      bot.sendMessage(userId, 'Завдання не знайдені.');
    }
  }).catch(err => {
    bot.sendMessage(userId, 'Не вдалося отримати список завдань.');
    console.error(err);
  });
});

bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data === 'view_tasks') {
    // Відображення завдань
    const tasks = await Task.find({ userId: callbackQuery.from.id });
    if (tasks.length > 0) {
      userTasks[chatId] = tasks;
      let message = tasks.map((task, index) => `${index + 1}: ${task.text} до ${task.dueDate.toISOString().substring(0, 10)}`).join('\n');
      bot.sendMessage(chatId, message).then(() => {
        bot.sendMessage(chatId, 'Чи хочете відредагувати якесь з завдань? (так/ні)');
        userStates[chatId] = 'waiting_for_edit_decision';
      });
    } else {
      bot.sendMessage(chatId, 'Завдання не знайдені.');
    }
    showMainMenu(chatId); // Повернення до головного меню після відображення завдань
  } else if (data === 'add_task') {
    bot.sendMessage(chatId, 'Введіть завдання у форматі: "Опис завдання YYYY-MM-DD"');
    userStates[chatId] = 'waiting_for_task';
  } else if (data === 'edit_category') {
    bot.sendMessage(chatId, 'Оберіть номер завдання для редагування категорії:');
    userStates[chatId] = 'waiting_for_task_number_category';
  } else if (data === 'edit_priority') {
    bot.sendMessage(chatId, 'Оберіть номер завдання для редагування пріоритету:');
    userStates[chatId] = 'waiting_for_task_number_priority';
  } else if (data === 'delete_task') {
    const tasks = await Task.find({ userId: callbackQuery.from.id });
    if (tasks.length > 0) {
      userTasks[chatId] = tasks;
      let message = tasks.map((task, index) => `${index + 1}: ${task.text} до ${task.dueDate.toISOString().substring(0, 10)}`).join('\n');
      bot.sendMessage(chatId, `Оберіть номер завдання для видалення:\n${message}`);
      userStates[chatId] = 'waiting_for_delete';
    } else {
      bot.sendMessage(chatId, 'Завдання не знайдені.');
      showMainMenu(chatId); // Повернення до головного меню, якщо завдань немає
    }
  } else if (data.startsWith('remind_frequency_')) {
    const frequency = data.split('_')[2];
    const lastTask = await Task.findOne({ userId: callbackQuery.from.id }).sort({ _id: -1 });
    if (lastTask) {
      lastTask.remind = true;
      lastTask.remindFrequency = frequency;
      await lastTask.save();
      bot.sendMessage(chatId, `Завдання успішно оновлено з нагадуванням ${frequency}.`);
    } else {
      bot.sendMessage(chatId, 'Не вдалося знайти останнє завдання для оновлення.');
    }
    delete userStates[chatId];
    showMainMenu(chatId);
  } else if (data === 'remind_yes') {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Раз в день', callback_data: 'remind_frequency_daily' }],
          [{ text: 'Раз в тиждень', callback_data: 'remind_frequency_weekly' }],
          [{ text: 'Раз в місяць', callback_data: 'remind_frequency_monthly' }],
          [{ text: 'Раз в рік', callback_data: 'remind_frequency_yearly' }]
        ]
      }
    };
    bot.sendMessage(chatId, 'Як часто нагадувати?', opts);
  } else if (data === 'remind_no') {
    bot.sendMessage(chatId, 'Добре, завдання додано без нагадувань.');
    delete userStates[chatId];
    showMainMenu(chatId);
  } else if (data === 'filter_tasks') {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'За часом', callback_data: 'filter_time' }],
          [{ text: 'За пріоритетом', callback_data: 'filter_priority' }],
          [{ text: 'За категорією', callback_data: 'filter_category' }]
        ]
      }
    };
    bot.sendMessage(chatId, 'Оберіть спосіб фільтрації:', opts);
  } else if (data === 'filter_time') {
    bot.sendMessage(chatId, 'Введіть дату початку у форматі YYYY-MM-DD');
    userStates[chatId] = 'waiting_for_start_date';
  } else if (data === 'filter_priority') {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Високий', callback_data: 'filter_priority_high' }],
          [{ text: 'Середній', callback_data: 'filter_priority_medium' }],
          [{ text: 'Низький', callback_data: 'filter_priority_low' }]
        ]
      }
    };
    bot.sendMessage(chatId, 'Оберіть пріоритет:', opts);
  } else if (data === 'filter_category') {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Дім', callback_data: 'filter_category_home' }],
          [{ text: 'Робота', callback_data: 'filter_category_work' }],
          [{ text: 'Особисте', callback_data: 'filter_category_personal' }]
        ]
      }
    };
    bot.sendMessage(chatId, 'Оберіть категорію:', opts);
  } else if (data.startsWith('filter_priority_')) {
    const priority = data.split('_')[2];
    const priorities = {
      high: 'високий',
      medium: 'середній',
      low: 'низький'
    };
    const tasks = await Task.find({ userId: callbackQuery.from.id, priority: priorities[priority] });
    if (tasks.length > 0) {
      let message = tasks.map((task, index) => `${index + 1}: ${task.text} до ${task.dueDate.toISOString().substring(0, 10)} (Пріоритет: ${task.priority})`).join('\n');
      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, 'Завдання не знайдені.');
    }
    showMainMenu(chatId);
  } else if (data.startsWith('filter_category_')) {
    const category = data.split('_')[2];
    const categories = {
      home: 'Дім',
      work: 'Робота',
      personal: 'Особисте'
    };
    const tasks = await Task.find({ userId: callbackQuery.from.id, category: categories[category] });
    if (tasks.length > 0) {
      let message = tasks.map((task, index) => `${index + 1}: ${task.text} до ${task.dueDate.toISOString().substring(0, 10)} (Категорія: ${task.category})`).join('\n');
      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, 'Завдання не знайдені.');
    }
    showMainMenu(chatId);
  }
});

// Обробка введення завдань
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (userStates[chatId] === 'waiting_for_task') {
    const parts = text.split(' ');
    const taskText = parts.slice(0, -1).join(' ');
    const dateString = parts[parts.length - 1];
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(dateString)) {
      bot.sendMessage(chatId, 'Невірний формат дати. Використовуйте YYYY-MM-DD.');
      return;
    }

    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Скидання часу для порівняння дати

    if (isNaN(dueDate.getTime()) || dueDate < today) {
      bot.sendMessage(chatId, 'Дата вже минула або невірний формат. Використовуйте YYYY-MM-DD і виберіть дату, не старішу за сьогодні.');
      return;
    }

    // Збереження завдання без нагадування
    const task = new Task({
      userId: msg.from.id,
      text: taskText,
      dueDate: dueDate,
      remind: false
    });

    await task.save()
      .then(() => {
        bot.sendMessage(chatId, 'Введіть категорію для завдання: (Дім, Робота, Особисте)');
        userStates[chatId] = 'waiting_for_category';
      })
      .catch(err => {
        bot.sendMessage(chatId, 'Не вдалося додати завдання.');
        console.error(err);
      });
  } else if (userStates[chatId] === 'waiting_for_category') {
    const lastTask = await Task.findOne({ userId: msg.from.id }).sort({ _id: -1 });
    const validCategories = ['Дім', 'Робота', 'Особисте'];
    if (!validCategories.includes(text)) {
      bot.sendMessage(chatId, 'Невірна категорія. Введіть Дім, Робота або Особисте.');
      return;
    }
    if (lastTask) {
      lastTask.category = text;
      await lastTask.save();
      bot.sendMessage(chatId, 'Введіть пріоритет для завдання (високий, середній, низький):');
      userStates[chatId] = 'waiting_for_priority';
    } else {
      bot.sendMessage(chatId, 'Не вдалося знайти останнє завдання для оновлення.');
    }
  } else if (userStates[chatId] === 'waiting_for_priority') {
    const lastTask = await Task.findOne({ userId: msg.from.id }).sort({ _id: -1 });
    const validPriorities = ['високий', 'середній', 'низький'];
    if (!validPriorities.includes(text.toLowerCase())) {
      bot.sendMessage(chatId, 'Невірний пріоритет. Введіть високий, середній або низький.');
      return;
    }
    if (lastTask) {
      lastTask.priority = text.toLowerCase();
      await lastTask.save();
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Так', callback_data: 'remind_yes' }],
            [{ text: 'Ні', callback_data: 'remind_no' }]
          ]
        }
      };
      bot.sendMessage(chatId, 'Завдання успішно додано. Чи бажаєте отримувати нагадування?', opts);
      userStates[chatId] = 'waiting_for_remind';
    } else {
      bot.sendMessage(chatId, 'Не вдалося знайти останнє завдання для оновлення.');
    }
  } else if (userStates[chatId] === 'waiting_for_remind') {
    if (text.toLowerCase() === 'так') {
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Раз в день', callback_data: 'remind_frequency_daily' }],
            [{ text: 'Раз в тиждень', callback_data: 'remind_frequency_weekly' }],
            [{ text: 'Раз в місяць', callback_data: 'remind_frequency_monthly' }],
            [{ text: 'Раз в рік', callback_data: 'remind_frequency_yearly' }]
          ]
        }
      };
      bot.sendMessage(chatId, 'Як часто нагадувати?', opts);
    } else if (text.toLowerCase() === 'ні') {
      bot.sendMessage(chatId, 'Добре, завдання додано без нагадувань.');
      delete userStates[chatId];
      showMainMenu(chatId);
    } else {
      bot.sendMessage(chatId, 'Будь ласка, відповідайте так або ні.');
    }
  } else if (userStates[chatId] === 'waiting_for_task_number_category') {
    const taskIndex = parseInt(text, 10) - 1;
    if (!isNaN(taskIndex) && userTasks[chatId] && userTasks[chatId][taskIndex]) {
      const taskId = userTasks[chatId][taskIndex]._id;
      userStates[chatId] = `waiting_for_category_${taskId}`;
      bot.sendMessage(chatId, 'Введіть нову категорію для завдання: (Дім, Робота, Особисте)');
    } else {
      bot.sendMessage(chatId, 'Невірний номер завдання.');
    }
  } else if (userStates[chatId] && userStates[chatId].startsWith('waiting_for_category_')) {
    const taskId = userStates[chatId].split('_')[2];
    const validCategories = ['Дім', 'Робота', 'Особисте'];
    if (!validCategories.includes(text)) {
      bot.sendMessage(chatId, 'Невірна категорія. Введіть Дім, Робота або Особисте.');
      return;
    }
    try {
      const task = await Task.findById(taskId);
      task.category = text;
      await task.save();
      bot.sendMessage(chatId, 'Категорію успішно оновлено.');
      delete userStates[chatId];
      showMainMenu(chatId);
    } catch (err) {
      bot.sendMessage(chatId, 'Не вдалося оновити категорію.');
      console.error(err);
    }
  } else if (userStates[chatId] === 'waiting_for_task_number_priority') {
    const taskIndex = parseInt(text, 10) - 1;
    if (!isNaN(taskIndex) && userTasks[chatId] && userTasks[chatId][taskIndex]) {
      const taskId = userTasks[chatId][taskIndex]._id;
      userStates[chatId] = `waiting_for_priority_${taskId}`;
      bot.sendMessage(chatId, 'Введіть новий пріоритет для завдання (високий, середній, низький):');
    } else {
      bot.sendMessage(chatId, 'Невірний номер завдання.');
    }
  } else if (userStates[chatId] && userStates[chatId].startsWith('waiting_for_priority_')) {
    const taskId = userStates[chatId].split('_')[2];
    const validPriorities = ['високий', 'середній', 'низький'];
    if (!validPriorities.includes(text.toLowerCase())) {
      bot.sendMessage(chatId, 'Невірний пріоритет. Введіть високий, середній або низький.');
      return;
    }
    try {
      const task = await Task.findById(taskId);
      task.priority = text.toLowerCase();
      await task.save();
      bot.sendMessage(chatId, 'Пріоритет успішно оновлено.');
      delete userStates[chatId];
      showMainMenu(chatId);
    } catch (err) {
      bot.sendMessage(chatId, 'Не вдалося оновити пріоритет.');
      console.error(err);
    }
  } else if (userStates[chatId] === 'waiting_for_delete') {
    const taskIndex = parseInt(text, 10) - 1;
    if (!isNaN(taskIndex) && userTasks[chatId] && userTasks[chatId][taskIndex]) {
      const taskId = userTasks[chatId][taskIndex]._id;
      await Task.findByIdAndDelete(taskId)
        .then(() => {
          bot.sendMessage(chatId, 'Завдання успішно видалено.');
          delete userTasks[chatId]; // Очищення завдань користувача після видалення
          delete userStates[chatId]; // Скидаємо стан після видалення завдання
          showMainMenu(chatId); // Повернення до головного меню
        })
        .catch(err => {
          bot.sendMessage(chatId, 'Не вдалося видалити завдання.');
          console.error(err);
        });
    } else {
      bot.sendMessage(chatId, 'Невірний номер завдання.');
    }
  } else if (userStates[chatId] === 'waiting_for_start_date') {
    const startDateString = text;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(startDateString)) {
      bot.sendMessage(chatId, 'Невірний формат дати. Використовуйте YYYY-MM-DD.');
      return;
    }

    const startDate = new Date(startDateString);
    if (isNaN(startDate.getTime())) {
      bot.sendMessage(chatId, 'Невірний формат дати. Використовуйте YYYY-MM-DD.');
      return;
    }

    bot.sendMessage(chatId, 'Введіть кінцеву дату у форматі YYYY-MM-DD');
    userStates[chatId] = 'waiting_for_end_date';
    userDateRanges[chatId] = { startDate };
  } else if (userStates[chatId] === 'waiting_for_end_date') {
    const endDateString = text;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(endDateString)) {
      bot.sendMessage(chatId, 'Невірний формат дати. Використовуйте YYYY-MM-DD.');
      return;
    }

    const endDate = new Date(endDateString);
    if (isNaN(endDate.getTime())) {
      bot.sendMessage(chatId, 'Невірний формат дати. Використовуйте YYYY-MM-DD.');
      return;
    }

    const { startDate } = userDateRanges[chatId];
    const tasks = await Task.find({
      userId: msg.from.id,
      dueDate: { $gte: startDate, $lte: endDate }
    });

    if (tasks.length > 0) {
      let message = tasks.map((task, index) => `${index + 1}: ${task.text} до ${task.dueDate.toISOString().substring(0, 10)}`).join('\n');
      bot.sendMessage(chatId, `Завдання з ${startDate.toISOString().substring(0, 10)} до ${endDate.toISOString().substring(0, 10)}:\n${message}`);
    } else {
      bot.sendMessage(chatId, 'Завдання не знайдені.');
    }

    delete userStates[chatId];
    delete userDateRanges[chatId];
    showMainMenu(chatId);
  } else if (userStates[chatId] === 'waiting_for_edit_decision') {
    if (text.toLowerCase() === 'так') {
      bot.sendMessage(chatId, 'Введіть номер завдання, яке хочете редагувати:');
      userStates[chatId] = 'waiting_for_edit_task_number';
    } else if (text.toLowerCase() === 'ні') {
      bot.sendMessage(chatId, 'Добре.');
      delete userStates[chatId];
      showMainMenu(chatId);
    } else {
      bot.sendMessage(chatId, 'Будь ласка, відповідайте так або ні.');
    }
  } else if (userStates[chatId] === 'waiting_for_edit_task_number') {
    const taskIndex = parseInt(text, 10) - 1;
    if (!isNaN(taskIndex) && userTasks[chatId] && userTasks[chatId][taskIndex]) {
      const taskId = userTasks[chatId][taskIndex]._id;
      userStates[chatId] = `waiting_for_edit_${taskId}`;
      bot.sendMessage(chatId, 'Що хочете змінити? (опис, дата)');
    } else {
      bot.sendMessage(chatId, 'Невірний номер завдання.');
    }
  } else if (userStates[chatId] && userStates[chatId].startsWith('waiting_for_edit_')) {
    const taskId = userStates[chatId].split('_')[2];
    const editField = text.toLowerCase();
    const validFields = ['опис', 'дата'];

    if (!validFields.includes(editField)) {
      bot.sendMessage(chatId, 'Невірний вибір. Оберіть з: опис, дата.');
      return;
    }

    userStates[chatId] = `waiting_for_new_${editField}_${taskId}`;
    bot.sendMessage(chatId, `Введіть нове значення для ${editField}:`);
  } else if (userStates[chatId] && userStates[chatId].startsWith('waiting_for_new_')) {
    const parts = userStates[chatId].split('_');
    const editField = parts[2];
    const taskId = parts[3];
    const newValue = text;

    try {
      const task = await Task.findById(taskId);

      if (editField === 'опис') {
        task.text = newValue;
      } else if (editField === 'дата') {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(newValue)) {
          bot.sendMessage(chatId, 'Невірний формат дати. Використовуйте YYYY-MM-DD.');
          return;
        }
        const newDate = new Date(newValue);
        if (isNaN(newDate.getTime())) {
          bot.sendMessage(chatId, 'Невірний формат дати. Використовуйте YYYY-MM-DD.');
          return;
        }
        task.dueDate = newDate;
      }

      await task.save();
      bot.sendMessage(chatId, `Завдання успішно оновлено. Поле "${editField}" змінено.`);
      delete userStates[chatId];
      showMainMenu(chatId);
    } catch (err) {
      bot.sendMessage(chatId, 'Не вдалося оновити завдання.');
      console.error(err);
    }
  }
});

// Функція для відправки нагадувань
const sendReminders = async () => {
  const tasks = await Task.find({ remind: true });
  const now = new Date();

  tasks.forEach(async (task) => {
    const user = await User.findOne({ telegramId: task.userId });
    if (!user) return;

    let remind = false;
    const lastReminder = task.lastReminder ? new Date(task.lastReminder) : new Date(0);
    console.log(`Checking task "${task.text}" for reminders. Last reminder: ${lastReminder}, now: ${now}`);

    switch (task.remindFrequency) {
      case 'daily':
        if (now - lastReminder >= 86400000) remind = true;
        break;
      case 'weekly':
        if (now - lastReminder >= 604800000) remind = true;
        break;
      case 'monthly':
        if ((now.getMonth() !== lastReminder.getMonth() || now.getFullYear() !== lastReminder.getFullYear()) && now > task.dueDate) remind = true;
        break;
      case 'yearly':
        if (now.getFullYear() !== lastReminder.getFullYear() && now > task.dueDate) remind = true;
        break;
    }

    if (remind) {
      bot.sendMessage(task.userId, `Нагадування: ${task.text} до ${task.dueDate.toISOString().substring(0, 10)} (Категорія: ${task.category}, Пріоритет: ${task.priority})`);
      task.lastReminder = now;
      await task.save();
    }
  });
};

// Запуск функції нагадувань кожну годину
setInterval(sendReminders, 60000); // Зменшено для тестування
 
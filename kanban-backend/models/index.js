const { Sequelize, DataTypes } = require('sequelize');

// Создание экземпляра Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite', // Путь к базе данных
    logging: false, // Отключить вывод SQL-запросов в консоль
});

// Импорт моделей
const Column = require('./Column')(sequelize, DataTypes); // Экспорт функции, возвращающей модель
const Task = require('./Task')(sequelize, DataTypes);    // Экспорт функции, возвращающей модель
const Comment = require('./Comment')(sequelize, DataTypes); // Новая модель комментариев
const User = require('./User')(sequelize, DataTypes); // Новая модель пользователей

// Установка связей между моделями
Column.hasMany(Task, { as: 'tasks', foreignKey: 'columnId', onDelete: 'CASCADE' });
Task.belongsTo(Column, { foreignKey: 'columnId' });

Task.hasMany(Comment, { as: 'comments', foreignKey: 'taskId', onDelete: 'CASCADE' });
Comment.belongsTo(Task, { foreignKey: 'taskId' });

// Метод для синхронизации базы данных
const syncDatabase = async () => {
	try {
	  await sequelize.sync({ force: false }); // Убедитесь, что force: false
	  console.log('База данных синхронизирована.');
	} catch (error) {
	  console.error('Ошибка при синхронизации базы данных:', error);
	}
  };

// Экспорт объектов и методов
module.exports = {
    sequelize,
    Column,
    Task,
    Comment,
    User,
    syncDatabase,
};

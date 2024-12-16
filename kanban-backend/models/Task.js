const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
	return sequelize.define('Task', {
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		createdBy: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		columnId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		isArchived: {
			type: DataTypes.BOOLEAN,
			defaultValue: false, // По умолчанию задача не архивирована
		},
		assignee: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'Unassigned', // По умолчанию задача не назначена
		},
		order: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0, // Начальный порядок задач
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: true, // Поле для связи задачи с пользователем
		},
		startDate: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		dueDate: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true, // Поле может быть пустым
		},
	});
};

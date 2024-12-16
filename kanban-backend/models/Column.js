module.exports = (sequelize, DataTypes) => {
	const Column = sequelize.define('Column', {
	  title: {
		type: DataTypes.STRING,
		allowNull: false,
	  },
	  color: {
		type: DataTypes.STRING,
		allowNull: true,
	  },
	  textColor: {
		type: DataTypes.STRING,
		allowNull: true,
	  },
	  icon: {
		type: DataTypes.STRING,
		allowNull: true,
	  },
	  isDone: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false, // По умолчанию ни одна колонка не будет Done
	  },
	});
  
	Column.associate = (models) => {
	  Column.hasMany(models.Task, { as: 'tasks', foreignKey: 'columnId' });
	};
  
	return Column;
  };
  
// models/Column.js
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
	  }
	});
	return Column;
  };
  
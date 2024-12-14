const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Comment', {
        content: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdBy: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        taskId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });
};

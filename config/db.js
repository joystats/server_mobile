const Sequelize = require('sequelize');
const sequelize = new Sequelize('PL', 'mi', 'miadmin', {
	host: '192.168.5.19',
	dialect:'mssql'
});

module.exports = sequelize;
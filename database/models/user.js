module.exports = function ({ sequelize, Sequelize }) {
	let User = sequelize.define('user', {
		num: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		uid: {
			type: Sequelize.BIGINT,
			unique: true
		},
		info: {
			type: Sequelize.JSON
		},
		point: {
			type: Sequelize.BIGINT,
			defaultValue: 0
		},
		money: {
			type: Sequelize.BIGINT,
			defaultValue: 0
		},
		nsfwTier: {
			type: Sequelize.INTEGER,
			defaultValue: 0
		},
		block: {
			type: Sequelize.BOOLEAN,
			defaultValue: false
		},
		dailytime: {
			type: Sequelize.BIGINT,
			defaultValue: 0
		},
		worktime: {
			type: Sequelize.BIGINT,
			defaultValue: 0
		},
		pornLeft: {
			type: Sequelize.INTEGER,
			defaultValue: 1
		},
		hentaiLeft: {
			type: Sequelize.INTEGER,
			defaultValue: 2
		}
	});
	return User;
}
const logger = require("../modules/log.js");
module.exports = function ({ models, api }) {
	const User = models.use('user');

	function createUser(id) {
		api.getUserInfo(id, (err, result) => {
			if (err) return logger(err, 2);
			const info = result[id];
			User.findOrCreate({ where: { uid: id } }).then(([user, created]) => {
				if (created) logger(id, 'New User');
			}).catch((error) => logger(error, 2))
		})
	}

	function getUsers(where = {}) {
		return User.findAll({ where }).then(e => e.map(e => e.get({ plain: true }))).catch((error) => {
			logger(error, 2);
			return [];
		})
	}

	function findUser(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return false;
		});
	}

	function getName(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(async function(user) {
			if (!user) return;
			let userInfo = await api.getUserInfo(uid);
			let name = userInfo[uid].name;
			return name.toString();
		});
	}

	function getGender(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(async function(user) {
			if (!user) return;
			let userInfo = await api.getUserInfo(uid);
			let gender = userInfo[uid].gender;
			return gender.toString();
		});
	}

	function unban(uid, block = false) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function (user) {
			if (!user) return;
			return user.update({ block });
		}).then(function () {
			return true;
		}).catch(function (error) {
			logger(error, 2);
			return false;
		})
	}

	function ban(uid) {
		return unban(uid, true);
	}

	return {
		createUser,
		getUsers,
		findUser,
		getName,
		getGender,
		unban,
		ban
	}
}
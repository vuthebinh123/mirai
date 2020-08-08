const logger = require("../modules/log.js");
module.exports = function({ models, api }) {
	const User = models.use('user');

	function createUser(id) {
		getName(id).then((nameUser) => {
			if (nameUser) return;
			api.getUserInfo(id, (err, result) => {
				if (err) return logger(err, 2);
				var name = result[id].name;
				var inventory = JSON.stringify('{"fish1": 0,"fish2": 0,"trash": 0,"crabs": 0,"crocodiles": 0,"whales": 0,"dolphins": 0,"blowfish": 0,"squid": 0,"sharks": 0}');
				var stats = JSON.stringify('{"casts": 0,"fish1": 0,"fish2": 0,"trash": 0,"crabs": 0,"crocodiles": 0,"whales": 0,"dolphins": 0,"blowfish": 0,"squid": 0,"sharks": 0}');
				User.findOrCreate({ where: { uid: id }, defaults: { name, inventory, stats } }).then(([user, created]) => {
					if (created) logger(id, 'New User');
				}).catch((error) => logger(error, 2))
			})
		});
	}

	function setUser(uid, options = {}) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.update(options);
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		});
	}

	function delUser(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(user => user.destroy());
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

	function getColumn(attr = []) {
		return User.findAll({ attributes: attr }).then(function(res) {
			let points = [];
			res.forEach(item => points.push(item.get({ plain: true })));
			return points;
		}).catch(err => {
			return [];
		});
	}

	function getName(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).name;
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
		}).then(function(user) {
			if (!user) return;
			return user.update({ block });
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		})
	}

	function ban(uid) {
		return unban(uid, true);
	}

	return {
		createUser,
		setUser,
		delUser,
		getUsers,
		getColumn,
		findUser,
		getName,
		getGender,
		unban,
		ban
	}
}
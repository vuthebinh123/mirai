const logger = require("../modules/log.js");
module.exports = function({ models, api }) {
	const User = models.use("user");

/* ==================== Last Time Fishing ==================== */

	function lastTimeFishing(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).lastTimeFishing;
		});
	}

	function updateLastTimeFishing(uid, lastTimeFishing) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.update({ lastTimeFishing });
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		});
	}
	
/* ==================== Inventory ==================== */

	function getInventory(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return JSON.parse(user.get({ plain: true }).inventory);
		});
	}

	function updateInventory(uid, inventory) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.update({ inventory: inventory });
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		});
	}

/* ==================== Stats ==================== */

	function getStats(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return JSON.parse(user.get({ plain: true }).stats);
		});
	}

	function updateStats(uid, stats) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.update({ stats: stats });
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		});
	}

	return {
		lastTimeFishing,
		updateLastTimeFishing,
		getInventory,
		updateInventory,
		getStats,
		updateStats
	};
};

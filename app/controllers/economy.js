const logger = require("../modules/log.js");
module.exports = function({ models, api }) {
	const User = models.use("user");
	
/* ==================== Daily ==================== */

	function getDailyTime(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).dailytime;
		});
	}

	function updateDailyTime(uid, dailytime) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.update({ dailytime });
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		});
	}

	/* ==================== Work ==================== */

	function getWorkTime(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).worktime;
		});
	}

	function updateWorkTime(uid, worktime) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.update({ worktime });
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		});
	}

	/* ==================== NSFW ==================== */
	
	function getNSFW(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).nsfwTier;
		}).catch(err => {
			logger(err, 2);
			return false;
		})
	}

	function setNSFW(uid, nsfwTier) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			if (nsfwTier == 0) return user.update({ nsfwTier, hentaiLeft: 2, pornLeft: 1 });
			else if (nsfwTier == 1) return user.update({ nsfwTier, hentaiLeft: 4, pornLeft: 2 });
			else if (nsfwTier == 2) return user.update({ nsfwTier, hentaiLeft: 8, pornLeft: 4 });
			else if (nsfwTier == 3) return user.update({ nsfwTier, hentaiLeft: 12, pornLeft: 6 });
			else if (nsfwTier == 4) return user.update({ nsfwTier, hentaiLeft: 16, pornLeft: 8 });
			else if (nsfwTier == 5) return user.update({ nsfwTier, hentaiLeft: -1, pornLeft: 10 });
			else if (nsfwTier == -1) return user.update({ nsfwTier, hentaiLeft: -1, pornLeft: -1 }); //God Mode
		}).catch(err => {
			logger(err, 2);
			return false;
		})
	}

	function buyNSFW(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(async function(user) {
			if (!user) return;
			let myTier = await getNSFW(uid);
			var money = await getMoney(uid);
			if (myTier == 5) return 'Không thể mua thêm vì bạn đã ở Hạng 5';
			const price = [2000, 6000, 10000, 14000, 20000];
			const tier = [1, 2, 3, 4, 5];
			var needPrice = price[tier.indexOf(myTier + 1)];
			if (money < needPrice) return 'Làm chưa mà đòi ăn? Vẫn còn thiếu ' + (needPrice - money) + ' đô kìa.';
			else {
				var getReturn = await subtractMoney(uid, needPrice);
				if (getReturn == true) {
					setNSFW(uid, myTier + 1);
					return 'Đã làm thì phải có ăn! Mua thành công Hạng ' + (myTier + 1);
				}
			}
		}).catch(function(error) {
			logger(error, 2);
			return false;
		})
	}

	function pornUseLeft(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).pornLeft;
		}).catch(err => {
			logger(err, 2);
			return false;
		})
	}

	function hentaiUseLeft(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).hentaiLeft;
		}).catch(err => {
			logger(err, 2);
			return false;
		})
	}

	function subtractHentai(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(async function(user) {
			if (!user) return;
			var useLeft = await hentaiUseLeft(uid);
			return user.update({ hentaiLeft: useLeft - 1 })
		}).catch(err => {
			logger(err, 2);
			return false;
		})
	}

	function subtractPorn(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(async function(user) {
			if (!user) return;
			var useLeft = await pornUseLeft(uid);
			return user.update({ pornLeft: useLeft - 1 })
		}).catch(err => {
			logger(err, 2);
			return false;
		})
	}

	function resetNSFW() {
		try {
			User.update({ hentaiLeft: -1, pornLeft: -1 }, {where: {nsfwTier: -1}});
			User.update({ hentaiLeft: 2, pornLeft: 1 }, {where: {nsfwTier: 0}});
			User.update({ hentaiLeft: 4, pornLeft: 2 }, {where: {nsfwTier: 1}});
			User.update({ hentaiLeft: 8, pornLeft: 4 }, {where: {nsfwTier: 2}});
			User.update({ hentaiLeft: 12, pornLeft: 6 }, {where: {nsfwTier: 3}});
			User.update({ hentaiLeft: 16, pornLeft: 8 }, {where: {nsfwTier: 4}});
			User.update({ hentaiLeft: -1, pornLeft: 10 }, {where: {nsfwTier: 5}});
			return true
		}
		catch (err) {
			logger(err, 2);
			return false;
		}
	}

	/* ==================== Money ==================== */

	function getMoney(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).money;
		});
	}

	function addMoney(uid, moneyIncrement) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			var moneyData = user.get({ plain: true }).money;
			return user.update({
				money: moneyData + moneyIncrement
			});
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		});
	}

	function subtractMoney(uid, moneyDecrement) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			var moneyData = user.get({ plain: true }).money;
			return user.update({
				money: moneyData - moneyDecrement
			});
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		});
	}

	function setMoney(uid, money) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.update({ money });
		}).then(function() {
			return true;
		}).catch(function(error) {
			logger(error, 2);
			return false;
		});
	}

	return {
		getDailyTime,
		updateDailyTime,
		getWorkTime,
		updateWorkTime,
		getNSFW,
		buyNSFW,
		setNSFW,
		pornUseLeft,
		hentaiUseLeft,
		subtractPorn,
		subtractHentai,
		resetNSFW,
		getMoney,
		addMoney,
		subtractMoney,
		setMoney
	};
};

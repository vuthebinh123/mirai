const modules = require("./modules");
const config = require("../config");
const axios = require('axios');
const semver = require('semver');
const fs = require('fs-extra');
module.exports = function({ api, models, __GLOBAL }) {
	const User = require("./controllers/user")({ models, api });
	const Thread = require("./controllers/thread")({ models, api });
	const Rank = require("./controllers/rank")({ models, api });
	const economy = require("./controllers/economy")({ models, api });
	(async () => {
		modules.log("Đang khởi tạo biến môi trường...");
		__GLOBAL.userBlocked = (await User.getUsers({ block: true })).map(e => e.uid);
		__GLOBAL.threadBlocked = (await Thread.getThreads({ block: true })).map(e => e.threadID);
		__GLOBAL.resendBlocked = (await Thread.getThreads({ blockResend: true })).map(e => e.threadID);
		__GLOBAL.NSFWBlocked = (await Thread.getThreads({ blockNSFW: true })).map(e => e.threadID);
		modules.log("Khởi tạo biến môi trường xong!");
	})();
	const handleMessage = require("./handle/message")({ api, modules, config, __GLOBAL, User, Thread, Rank, economy });
	const handleEvent = require("./handle/event")({ api, config, __GLOBAL, User, Thread });
	const handleUnsend = require("./handle/unsend")({ api, __GLOBAL, User });
	modules.log(config.prefix || "<Không có>", "[ PREFIX ]");
	modules.log(`${api.getCurrentUserID()} - ${config.botName}`, "[ UID ]");
	modules.log("Bắt đầu hoạt động!");
	modules.log("This bot was made by Catalizcs(roxtigger2003) and SpermLord(spermlord)");
	axios.get('https://raw.githubusercontent.com/roxtigger2003/mirai/master/package.json').then((res) => {
		modules.log("Đang kiểm tra cập nhật...", 1);
		var local = JSON.parse(fs.readFileSync('./package.json')).version;
		var remote = res.data.version;
		if (semver.lt(local, remote)) {
			modules.log('Đã có bản cập nhật mới! Hãy bật terminal/cmd và gõ "node update" để cập nhật!', -1);
			fs.writeFileSync('./.needUpdate', '');
		}
		else {
			if (fs.existsSync('./.needUpdate')) fs.removeSync('./.needUpdate');
			modules.log('Bạn đang sử dụng bản mới nhất!', 1);
		}
	}).catch(err => console.error(err));
	return function(error, event) {
		if (error) return modules.log(error, 2);
		switch (event.type) {
			case "message":
			case "message_reply":
				handleMessage({ event });
				break;
			case "message_unsend":
				handleUnsend({ event });
				break;
			case "event":
				handleEvent({ event });
				break;
			default:
				return;
				break;
		}
	};
};
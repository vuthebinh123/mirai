module.exports = function({ api, modules, config, __GLOBAL, User, Thread, Rank, Economy }) {
	/* ================ Config ==================== */
	let {prefix, googleSearch, wolfarm, yandex, openweather, tenor, saucenao, admins, ENDPOINT, nsfwGodMode} = config;
	const fs = require("fs-extra");
	const moment = require("moment-timezone");
	const request = require("request");
	const ms = require("parse-ms");
	const stringSimilarity = require('string-similarity');
	var resetNSFW = false;

	/* ================ Check update ================ */
	const axios = require('axios');
	const semver = require('semver');
	axios.get('https://raw.githubusercontent.com/roxtigger2003/mirai/master/package.json').then((res) => {
		modules.log("Đang kiểm tra cập nhật...", 1);
		var local = JSON.parse(fs.readFileSync('./package.json')).version;
		var remote = res.data.version;
		if (semver.lt(local, remote)) {
			modules.log('Đã có bản cập nhật mới! Hãy bật terminal/cmd và gõ "node update" để cập nhật!', 1);
			api.sendMessage('Đã có bản cập nhật mới! Hãy bật terminal/cmd và gõ "node update" để cập nhật!', admins[0]);
			fs.writeFileSync('./.needUpdate', '');
		}
		else {
			if (fs.existsSync('./.needUpdate')) fs.removeSync('./.needUpdate');
			modules.log('Bạn đang sử dụng bản mới nhất!', 1);
		}
	}).catch(err => console.error(err));

	/* ================ CronJob ==================== */
	if (!fs.existsSync(__dirname + "/src/groupID.json")) {
		var data = [];
		api.getThreadList(100, null, ["INBOX"], function(err, list) {
			if (err) throw err;
			list.forEach(item => {
				if (item.isGroup == true) data.push(item.threadID);
			});
			fs.writeFile(__dirname + "/src/groupID.json", JSON.stringify(data), err => {
				if (err) throw err;
				modules.log("Tạo file groupID mới thành công!");
			});
		});
	}
	else {
		fs.readFile(__dirname + "/src/groupID.json", "utf-8", (err, data) => {
			if (err) throw err;
			var groupids = JSON.parse(data);
			if (!fs.existsSync(__dirname + "/src/listThread.json")) {
				var firstJSON = {
					wake: [],
					sleep: []
				};
				fs.writeFileSync(__dirname + "/src/listThread.json", JSON.stringify(firstJSON));
				modules.log("Tạo file listThread mới thành công!");
			}
			setInterval(() => {
				var oldData = JSON.parse(fs.readFileSync(__dirname + "/src/listThread.json"));
				var timer = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm");
				groupids.forEach(item => {
					while (timer == "23:00" && !oldData.sleep.includes(item)) {
						api.sendMessage(`Tới giờ ngủ rồi đấy nii-chan, おやすみなさい!`, item);
						oldData.sleep.push(item);
						break;
					}
					while (timer == "07:00" && !oldData.wake.includes(item)) {
						api.sendMessage(`おはようございます các nii-chan uwu`, item);
						oldData.wake.push(item);
						break;
					}
					fs.writeFileSync(__dirname + "/src/listThread.json", JSON.stringify(oldData));
				});
				if (timer == "23:05" || timer == "07:05") fs.unlinkSync(__dirname + "/src/listThread.json");
				if (timer == "00:00")
					if (resetNSFW == false) {
						resetNSFW = true;
						Economy.resetNSFW();
					}
			}, 1000);
		});
	}

	if (!fs.existsSync(__dirname + "/src/quotes.json")) {
		request("https://type.fit/api/quotes", (err, response, body) => {
			if (err) throw err;
			var bodyReplace = body.replace("\n", "");
			fs.writeFile(__dirname + "/src/quotes.json", bodyReplace, "utf-8", (err) => {
				if (err) throw err;
				modules.log("Tạo file quotes mới thành công!");
			});
		});
	}

	if (!fs.existsSync(__dirname + "/src/shortcut.json")) {
		var template = [];
		fs.writeFileSync(__dirname + "/src/shortcut.json", JSON.stringify(template));
		return modules.log('Tạo file shortcut mới thành công!');
	}

	return function({ event }) {
		let { body: contentMessage, senderID, threadID, messageID } = event;
		senderID = parseInt(senderID);
		threadID = parseInt(threadID);
		messageID = messageID.toString();

		if (__GLOBAL.userBlocked.includes(senderID)) return;
		User.createUser(senderID);
		Thread.createThread(threadID);

		__GLOBAL.messages.push({
			msgID: messageID,
			msgBody: contentMessage
		});

	/* ================ Staff Commands ==================== */
		//lấy shortcut
		if (contentMessage.length !== -1) {
			let shortcut = JSON.parse(fs.readFileSync(__dirname + "/src/shortcut.json"));
			if (shortcut.some(item => item.id == threadID)) {
				let getThread = shortcut.find(item => item.id == threadID).shorts;
				if (getThread.some(item => item.in == contentMessage)) return api.sendMessage(getThread.find(item => item.in == contentMessage).out, threadID);
			}
		}

		//lấy file cmds
		var nocmdData = JSON.parse(fs.readFileSync(__dirname + "/src/cmds.json"));

		//tạo 1 đối tượng mới nếu group chưa có trong file cmds
		if (!nocmdData.banned.some(item => item.id == threadID)) {
			let addThread = {
				id: threadID,
				cmds: []
			};
			nocmdData.banned.push(addThread);
			fs.writeFileSync(__dirname + "/src/cmds.json", JSON.stringify(nocmdData));
		}

		//lấy lệnh bị cấm trong group
		var cmds = nocmdData.banned.find(item => item.id == threadID).cmds;
		for (const item of cmds) if (contentMessage.indexOf(prefix + item) == 0) return api.sendMessage("Lệnh này đã bị cấm!", threadID);

		//unban command
		if (contentMessage.indexOf(`${prefix}unban command`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 14,contentMessage.length);
			if (!content) return api.sendMessage("Hãy nhập lệnh cần bỏ cấm!", threadID);
			var jsonData = JSON.parse(fs.readFileSync(__dirname + "/src/cmds.json"));
			var getCMDS = jsonData.banned.find(item => item.id == threadID).cmds;
			if (!getCMDS.includes(content)) return api.sendMessage("Lệnh " + content + " chưa bị cấm", threadID);
			else {
				let getIndex = getCMDS.indexOf(content);
				getCMDS.splice(getIndex, 1);
				api.sendMessage("Đã bỏ cấm " + content + " trong group này", threadID);
			}
			fs.writeFileSync(__dirname + "/src/cmds.json", JSON.stringify(jsonData), "utf-8");
			return;
		}

		//ban command
		if (contentMessage.indexOf(`${prefix}ban command`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 12, contentMessage.length);
			if (!content) return api.sendMessage("Hãy nhập lệnh cần cấm!", threadID);
			var jsonData = JSON.parse(fs.readFileSync(__dirname + "/src/cmds.json"));
			if (!jsonData.cmds.includes(content)) return api.sendMessage("Không có lệnh " + content + " trong cmds.json nên không thể cấm",threadID);
			else {
				if (jsonData.banned.some(item => item.id == threadID)) {
					let getThread = jsonData.banned.find(item => item.id == threadID);
					getThread.cmds.push(content);
				}
				else {
					let addThread = {
						id: threadID,
						cmds: []
					};
					addThread.cmds.push(content);
					jsonData.banned.push(addThread);
				}
				api.sendMessage("Đã cấm " + content + " trong group này", threadID);
			}
			fs.writeFileSync(__dirname + "/src/cmds.json", JSON.stringify(jsonData), "utf-8");
			return;
		}

		// Unban thread
		if (__GLOBAL.threadBlocked.includes(threadID)) {
			if (contentMessage == `${prefix}unban thread` && admins.includes(senderID)) {
				const indexOfThread = __GLOBAL.threadBlocked.indexOf(threadID);
				if (indexOfThread == -1) return api.sendMessage("Nhóm này chưa bị chặn!", threadID);
				Thread.unban(threadID).then(success => {
					if (!success) return api.sendMessage("Không thể bỏ chặn nhóm này!", threadID);
					api.sendMessage("Nhóm này đã được bỏ chặn!", threadID);
					__GLOBAL.threadBlocked.splice(indexOfThread, 1);
					modules.log(threadID, "Unban Thread");
				});
			}
			return;
		}

		Rank.updatePoint(senderID, 1);

		// Unban user
		if (contentMessage.indexOf(`${prefix}unban`) == 0 && admins.includes(senderID)) {
			const mentions = Object.keys(event.mentions);
			if (!mentions) return api.sendMessage("Vui lòng tag những người cần unban", threadID);
			mentions.forEach(mention => {
				const indexOfUser = __GLOBAL.userBlocked.indexOf(parseInt(mention));
				if (indexOfUser == -1)
					return api.sendMessage(
						{
							body: `${event.mentions[mention]} chưa bị ban, vui lòng ban trước!`,
							mentions: [
								{
									tag: event.mentions[mention],
									id: mention
								}
							]
						},
						threadID
					);
				User.unban(mention).then(success => {
					if (!success) return api.sendMessage("Không thể unban người này!", threadID);
					api.sendMessage(
						{
							body: `Đã unban ${event.mentions[mention]}!`,
							mentions: [
								{
									tag: event.mentions[mention],
									id: mention
								}
							]
						},
						threadID
					);
					__GLOBAL.userBlocked.splice(indexOfUser, 1);
					modules.log(mentions, "Unban User");
				});
			});
			return;
		}

		// Ban thread
		if (contentMessage == `${prefix}ban thread` && admins.includes(senderID)) {
			Thread.ban(parseInt(threadID)).then((success) => {
				if (!success) return api.sendMessage("Không thể ban group này!", threadID);
				api.sendMessage("Nhóm này đã bị chặn tin nhắn!.", threadID);
				__GLOBAL.threadBlocked.push(parseInt(threadID));
			})
			return;
		}

		// Ban user
		if (contentMessage.indexOf(`${prefix}ban`) == 0 && admins.includes(senderID)) {
			const mentions = Object.keys(event.mentions);
			if (!mentions) return api.sendMessage("Vui lòng tag những người cần ban!", threadID);
			mentions.forEach(mention => {
				if (__GLOBAL.threadBlocked.includes(mention)) return api.sendMessage(`${event.mentions[mention]} đã bị ban từ trước!`, threadID, messageID);
				User.ban(parseInt(mention)).then((success) => {
					if (!success) return api.sendMessage("Không thể ban người này!", threadID);
					api.sendMessage({
						body: `${event.mentions[mention]} đã bị ban!`,
						mentions: [
							{
								tag: event.mentions[mention],
								id: parseInt(mention)
							}
						]
					}, threadID);
					__GLOBAL.userBlocked.push(parseInt(mention));
					modules.log(parseInt(mention), 'Ban User');
				})
			});
			return;
		}

		//resend
		if (contentMessage.indexOf(`${prefix}resend`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 7, contentMessage.length);
			if (content == 'off') {
				if (__GLOBAL.resendBlocked.includes(threadID)) return api.sendMessage("Nhóm này đã bị tắt resend từ trước!", threadID, messageID);
				Thread.blockResend(threadID).then((success) => {
					if (!success) return api.sendMessage("Oops, không thể tắt resend ở nhóm này!", threadID);
					api.sendMessage("Đã tắt resend tin nhắn thành công!", threadID);
					__GLOBAL.resendBlocked.push(threadID);
				})
			}
			else if (content == 'on') {
				if (!__GLOBAL.resendBlocked.includes(threadID)) return api.sendMessage("Nhóm này chưa bị tắt resend", threadID);
				Thread.unblockResend(threadID).then(success => {
					if (!success) return api.sendMessage("Oops, không thể bật resend ở nhóm này!", threadID);
					api.sendMessage("Đã bật resend tin nhắn, tôi sẽ nhắc lại tin nhắn bạn đã xoá 😈", threadID);
					__GLOBAL.resendBlocked.splice(__GLOBAL.resendBlocked.indexOf(threadID), 1);
				});
			}
			return;
		}

		//Thông báo tới toàn bộ group!
		if (contentMessage.indexOf(`${prefix}noti`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (!content) return api.sendMessage("Nhập thông tin vào!", threadID, messageID);
			api.getThreadList(100, null, ["INBOX"], function(err, list) {
				if (err) throw err;
				list.forEach(item => {
					if (item.isGroup == true && item.threadID != threadID) api.sendMessage(content, item.threadID);
				});
				modules.log("Gửi thông báo mới thành công!");
			});
			return;
		}

		//giúp thành viên thông báo lỗi về admin
		if (contentMessage.indexOf(`${prefix}report`) == 0) {
			var content = contentMessage.slice(prefix.length + 7, contentMessage.length);
			if (!content) return api.sendMessage("Có vẻ như bạn chưa nhập thông tin, vui lòng nhập thông tin lỗi mà bạn gặp!", threadID, messageID);
			(async () => {
				var userName = await User.getName(senderID)
				var threadName = await Thread.getName(threadID)
				api.sendMessage(
					"Báo cáo từ: " + userName +
					"\nGroup gặp lỗi: " + threadName +
					"\nLỗi gặp phải: " + content +
					"\nThời gian báo: " + moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss"),
					admins[0]
				)
			})()
			return api.sendMessage("Thông tin lỗi của bạn đã được gửi về admin!", threadID, messageID);
		}

		//nsfw
		if (contentMessage.indexOf(`${prefix}nsfw`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (content == 'off') {
				if (__GLOBAL.NSFWBlocked.includes(threadID)) return api.sendMessage("Nhóm này đã bị tắt NSFW từ trước!", threadID, messageID);
				Thread.blockNSFW(threadID).then((success) => {
					if (!success) return api.sendMessage("Oops, không thể tắt NSFW ở nhóm này!", threadID);
					api.sendMessage("Đã tắt NSFW thành công!", threadID);
					__GLOBAL.NSFWBlocked.push(threadID);
				})
			}
			else if (content == 'on') {
				if (!__GLOBAL.NSFWBlocked.includes(threadID)) return api.sendMessage("Nhóm này chưa bị tắt NSFW", threadID);
				Thread.unblockNSFW(threadID).then(success => {
					if (!success) return api.sendMessage("Oops, không thể bật NSFW ở nhóm này!", threadID);
					api.sendMessage("Đã bật NSFW thành công!", threadID);
					__GLOBAL.NSFWBlocked.splice(__GLOBAL.NSFWBlocked.indexOf(threadID), 1);
				});
			}
			return;
		}

		//restart
		if (contentMessage == `${prefix}restart` && admins.includes(senderID)) return api.sendMessage(`Hệ thống restart khẩn ngay bây giờ!!`, threadID, () => require("node-cmd").run("pm2 restart 0"), messageID);

	/* ==================== Help Commands ================*/

		//add thêm lệnh cho help
		if (contentMessage.indexOf(`${prefix}sethelp`) == 0 && admins.includes(senderID)) {
			var string = contentMessage.slice(prefix.length + 8, contentMessage.length);
			if (string.length == 0) return api.sendMessage("Vui lòng nhập hướng dẫn lệnh cần thêm theo format!", threadID, messageID);

			let stringIndexOf = string.indexOf(" | ");
			let name = string.slice(0, stringIndexOf);
			let center = string.slice(stringIndexOf + 1, string.length);

			let stringIndexOf2 = center.indexOf(" | ");
			let decs = center.slice(0, stringIndexOf2);
			let stringNext = center.slice(stringIndexOf2 + 1, center.length);

			let stringIndexOf3 = stringNext.indexOf(" | ");
			let usage = stringNext.slice(0, stringIndexOf3);
			let stringNext2 = stringNext.slice(stringIndexOf3 + 1, stringNext.length);

			let stringIndexOf4 = stringNext2.indexOf(" | ");
			let example = stringNext2.slice(0, stringIndexOf4);
			let group = stringNext2.slice(stringIndexOf4 + 1, stringNext2.length);

			var oldDataJSON = JSON.parse(fs.readFileSync(__dirname + "/src/listCommands.json"));
			var pushJSON = {
				name: name,
				decs: decs,
				usage: usage,
				example: example,
				group: group
			};
			oldDataJSON.push(pushJSON);
			fs.writeFileSync(__dirname + "/src/listCommands.json", JSON.stringify(oldDataJSON));
			return api.sendMessage("Đã ghi xong!", threadID, messageID);
		}

		//delete lệnh trong help
		if (contentMessage.indexOf(`${prefix}delhelp`) == 0 && admins.includes(senderID)) {
			var string = contentMessage.slice(prefix.length + 8, contentMessage.length);
			var oldDataJSON = JSON.parse(fs.readFileSync(__dirname + "/src/listCommands.json"));
			const index = oldDataJSON.findIndex(x => x.name === string);
			if (index !== undefined) oldDataJSON.splice(index, 1);
			fs.writeFile(__dirname + "/src/listCommands.json", JSON.stringify(oldDataJSON));
			return api.sendMessage("Xóa lệnh hoàn tất!", threadID, messageID);
		}

		//help
		if (contentMessage.indexOf(`${prefix}help`) == 0) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			var helpList = JSON.parse(fs.readFileSync(__dirname + "/src/listCommands.json"));
			if (content.length == 0) {
				var helpGroup = [];
				var helpMsg = "";
				helpList.forEach(help => {
					if (!helpGroup.some(item => item.group == help.group)) helpGroup.push({ group: help.group, cmds: [help.name] });
					else helpGroup.find(item => item.group == help.group).cmds.push(help.name);
				});
				helpGroup.forEach(help => helpMsg += `===== ${help.group.charAt(0).toUpperCase() + help.group.slice(1)} =====\n${help.cmds.join(', ')}\n\n`);
				return api.sendMessage(helpMsg, threadID, messageID);
			}
			else {
				if (helpList.some(item => item.name == content))
					return api.sendMessage(
						'=== Thông tin lệnh bạn đang tìm ===\n' +
						'- Tên lệnh: ' + helpList.find(item => item.name == content).name + '\n' +
						'- Nhóm lệnh: ' + helpList.find(item => item.name == content).group + '\n' +
						'- Thông tin: ' + helpList.find(item => item.name == content).decs + '\n' +
						'- Cách dùng: ' + prefix + helpList.find(item => item.name == content).usage + '\n' +
						'- Hướng dẫn: ' + prefix + helpList.find(item => item.name == content).example,
						threadID, messageID
					);
				else return api.sendMessage(`Lệnh bạn nhập không hợp lệ, hãy gõ ${prefix}help để xem tất cả các lệnh có trong bot.`, threadID, messageID);
			}
		}

		//yêu cầu công việc cho bot
		if (contentMessage.indexOf(`${prefix}request`) == 0) {
			var content = contentMessage.slice(prefix.length + 8,contentMessage.length);
			if (!fs.existsSync(__dirname + "/src/requestList.json")) {
				let requestList = [];
				fs.writeFileSync(__dirname + "/src/requestList.json",JSON.stringify(requestList));
			}
			if (content.indexOf("add") == 0) {
				var addnew = content.slice(4, content.length);
				var getList = fs.readFileSync(__dirname + "/src/requestList.json");
				var getData = JSON.parse(getList);
				getData.push(addnew);
				fs.writeFileSync(__dirname + "/src/requestList.json", JSON.stringify(getData));
				return api.sendMessage("Đã thêm: " + addnew, threadID, () => api.sendMessage("ID " + senderID + " Đã thêm '" + addnew + "' vào request list", admins[0]), messageID);
			}
			else if (content.indexOf("del") == 0 && admins.includes(senderID)) {
				var deletethisthing = content.slice(4, content.length);
				var getList = fs.readFileSync(__dirname + "/src/requestList.json");
				var getData = JSON.parse(getList);
				if (getData.length == 0) return api.sendMessage("Không tìm thấy " + deletethisthing, threadID, messageID);
				var itemIndex = getData.indexOf(deletethisthing);
				getData.splice(itemIndex, 1);
				fs.writeFileSync(__dirname + "/src/requestList.json", JSON.stringify(getData));
				return api.sendMessage("Đã xóa: " + deletethisthing, threadID, messageID);
			}
			else if (content.indexOf("list") == 0) {
				var getList = fs.readFileSync(__dirname + "/src/requestList.json");
				var getData = JSON.parse(getList);
				if (getData.length == 0) return api.sendMessage("Không có việc cần làm", threadID, messageID);
				let allWorks = "";
				getData.map(item => allWorks = allWorks + `\n- ` + item);
				return api.sendMessage("Đây là toàn bộ yêu cầu mà các bạn đã gửi:" + allWorks, threadID, messageID);
			}
		}

	/* ==================== Cipher Commands ================*/

		//morse
		if (contentMessage.indexOf(`${prefix}morse`) == 0) {
			const morsify = require('morsify');
			var content = contentMessage.slice(prefix.length + 6, contentMessage.length);
			if (event.type == "message_reply") {
				if (content.indexOf('encode') == 0) return api.sendMessage(morsify.encode(event.messageReply.body), threadID, messageID);
				else if (content.indexOf('decode') == 0)return api.sendMessage(morsify.decode(event.messageReply.body), threadID, messageID);
				else return api.sendMessage(`Sai cú pháp, vui lòng tìm hiểu thêm tại ${prefix}help morse`, threadID, messageID);
			}
			else {
				if (content.indexOf('encode') == 0) return api.sendMessage(morsify.encode(content.slice(7, contentMessage.length)), threadID, messageID);
				else if (content.indexOf('decode') == 0) return api.sendMessage(morsify.decode(content.slice(7, contentMessage.length)), threadID, messageID);
				else return api.sendMessage(`Sai cú pháp, vui lòng tìm hiểu thêm tại ${prefix}help morse`, threadID, messageID);
			}
		}

		//caesar
		if (contentMessage.indexOf(`${prefix}caesar`) == 0) {
			if (process.env.CAESAR == '' || process.env.CAESAR == null) return api.sendMessage('Chưa đặt mật khẩu CAESAR trong file .env', threadID, messageID);
			const Caesar = require('caesar-salad').Caesar;
			var content = contentMessage.slice(prefix.length + 7, contentMessage.length);
			if (event.type == "message_reply") {
				if (content.indexOf('encode') == 0) return api.sendMessage(Caesar.Cipher(process.env.CAESAR).crypt(event.messageReply.body), threadID, messageID);
				else if (content.indexOf('decode') == 0) return api.sendMessage(Caesar.Decipher(process.env.CAESAR).crypt(event.messageReply.body), threadID, messageID);
				else return api.sendMessage(`Sai cú pháp, vui lòng tìm hiểu thêm tại ${prefix}help caesar`, threadID, messageID);
			}
			else {
				if (content.indexOf('encode') == 0) return api.sendMessage(Caesar.Cipher(process.env.CAESAR).crypt(content.slice(7, contentMessage.length)), threadID, messageID);
				else if (content.indexOf('decode') == 0) return api.sendMessage(Caesar.Decipher(process.env.CAESAR).crypt(content.slice(7, contentMessage.length)), threadID, messageID);
				else return api.sendMessage(`Sai cú pháp, vui lòng tìm hiểu thêm tại ${prefix}help caesar`, threadID, messageID);
			}
		}

		//vigenere
		if (contentMessage.indexOf(`${prefix}vigenere`) == 0) {
			if (process.env.VIGENERE == '' || process.env.VIGENERE == null) return api.sendMessage('Chưa đặt mật khẩu VIGENERE trong file .env', threadID, messageID);
			const Vigenere = require('caesar-salad').Vigenere;
			var content = contentMessage.slice(prefix.length + 9, contentMessage.length);
			if (event.type == "message_reply") {
				if (content.indexOf('encode') == 0) return api.sendMessage(Vigenere.Cipher(process.env.VIGENERE).crypt(event.messageReply.body), threadID, messageID);
				else if (content.indexOf('decode') == 0) return api.sendMessage(Vigenere.Decipher(process.env.VIGENERE).crypt(event.messageReply.body), threadID, messageID);
				else return api.sendMessage(`Sai cú pháp, vui lòng tìm hiểu thêm tại ${prefix}help vigenere`, threadID, messageID);
			}
			else {
				if (content.indexOf('encode') == 0) return api.sendMessage(Vigenere.Cipher(process.env.VIGENERE).crypt(content.slice(7, contentMessage.length)), threadID, messageID);
				else if (content.indexOf('decode') == 0) return api.sendMessage(Vigenere.Decipher(process.env.VIGENERE).crypt(content.slice(7, contentMessage.length)), threadID, messageID);
				else return api.sendMessage(`Sai cú pháp, vui lòng tìm hiểu thêm tại ${prefix}help vigenere`, threadID, messageID);
			}
		}

		//rot47
		if (contentMessage.indexOf(`${prefix}rot47`) == 0) {
			const ROT47 = require('caesar-salad').ROT47;
			var content = contentMessage.slice(prefix.length + 6, contentMessage.length);
			if (event.type == "message_reply") {
				if (content.indexOf('encode') == 0) return api.sendMessage(ROT47.Cipher().crypt(event.messageReply.body), threadID, messageID);
				else if (content.indexOf('decode') == 0) return api.sendMessage(ROT47.Decipher().crypt(event.messageReply.body), threadID, messageID);
				else return api.sendMessage(`Sai cú pháp, vui lòng tìm hiểu thêm tại ${prefix}help rot47`, threadID, messageID);
			}
			else {
				if (content.indexOf('encode') == 0) return api.sendMessage(ROT47.Cipher().crypt(content.slice(7, contentMessage.length)), threadID, messageID);
				else if (content.indexOf('decode') == 0) return api.sendMessage(ROT47.Decipher().crypt(content.slice(7, contentMessage.length)), threadID, messageID);
				else return api.sendMessage(`Sai cú pháp, vui lòng tìm hiểu thêm tại ${prefix}help rot47`, threadID, messageID);
			}
		}

	/* ==================== General Commands ================*/

		//shortcut
		if (contentMessage.indexOf(`${prefix}short`) == 0) {
			var content = contentMessage.slice(prefix.length + 6, contentMessage.length);
			if (!content) return api.sendMessage(`Không đúng format. Hãy tìm hiểu thêm tại ${prefix}help short.`, threadID, messageID);
			if (content.indexOf(`del`) == 0) {
				let delThis = contentMessage.slice(prefix.length + 10, contentMessage.length);
				if (!delThis) return api.sendMessage("Chưa nhập shortcut cần xóa.", threadID, messageID);
				return fs.readFile(__dirname + "/src/shortcut.json", "utf-8", (err, data) => {
					if (err) throw err;
					var oldData = JSON.parse(data);
					var getThread = oldData.find(item => item.id == threadID).shorts;
					if (!getThread.some(item => item.in == delThis)) return api.sendMessage("Shortcut này không tồn tại.", threadID, messageID);
					getThread.splice(getThread.findIndex(item => item.in === delThis), 1);
					fs.writeFile(__dirname + "/src/shortcut.json", JSON.stringify(oldData), "utf-8", (err) => {
						if (err) throw err;
						api.sendMessage("Xóa shortcut thành công!", threadID, messageID);
					});
				});
			}
			else if (content.indexOf(`all`) == 0) 
				return fs.readFile(__dirname + "/src/shortcut.json", "utf-8", (err, data) => {
					if (err) throw err;
					let allData = JSON.parse(data);
					let msg = '';
					if (!allData.some(item => item.id == threadID)) return api.sendMessage('Hiện tại không có shortcut nào.', threadID, messageID);
					if (allData.some(item => item.id == threadID)) {
						let getThread = allData.find(item => item.id == threadID).shorts;
						getThread.forEach(item => msg = msg + item.in + ' -> ' + item.out + '\n');
					}
					if (!msg) return api.sendMessage('Hiện tại không có shortcut nào.', threadID, messageID);
					msg = 'Tất cả shortcut đang có trong group là:\n' + msg;
					api.sendMessage(msg, threadID, messageID);
				});
			else {
				let narrow = content.indexOf(" => ");
				if (narrow == -1) return api.sendMessage(`Không đúng format. Hãy tìm hiểu thêm tại ${prefix}help short.`, threadID, messageID);
				let shortin = content.slice(0, narrow);
				let shortout = content.slice(narrow + 4, content.length);
				if (shortin == shortout) return api.sendMessage('Input và output giống nhau', threadID, messageID);
				if (!shortin) return api.sendMessage("Bạn chưa nhập input.", threadID, messageID);
				if (!shortout) return api.sendMessage("Bạn chưa nhập output.", threadID, messageID);
				return fs.readFile(__dirname + "/src/shortcut.json", "utf-8", (err, data) => {
					if (err) throw err;
					var oldData = JSON.parse(data);
					if (!oldData.some(item => item.id == threadID)) {
						let addThis = {
							id: threadID,
							shorts: []
						}
						addThis.shorts.push({ in: shortin, out: shortout });
						oldData.push(addThis);
						fs.writeFileSync(__dirname + "/src/shortcut.json", JSON.stringify(oldData));
						return;
					}
					let getShort = oldData.find(item => item.id == threadID);
					if (getShort.shorts.some(item => item.in == shortin)) return api.sendMessage("Shortcut này đã tồn tại trong group này!", threadID, messageID);
					getShort.shorts.push({ in: shortin, out: shortout });
					fs.writeFile(__dirname + "/src/shortcut.json", JSON.stringify(oldData), "utf-8", (err) => {
						if (err) throw err;
						api.sendMessage("Tạo shortcut mới thành công!", threadID, messageID);
					});
				});
			}
		}

		//wake time calculator
		if (contentMessage.indexOf(`${prefix}sleep`) == 0) {
			const moment = require("moment-timezone");
			var content = contentMessage.slice(prefix.length + 6, contentMessage.length);
			var wakeTime = [];
			if (!content) {
				for (var i = 1; i < 7; i++) wakeTime.push(moment().utcOffset("+07:00").add(90 * i + 15, 'm').format("HH:mm"));
				return api.sendMessage("Nếu bạn đi ngủ bây giờ, những thời gian hoàn hảo nhất để thức dậy là:\n" + wakeTime.join(', ') + "\nFact: Thời gian để bạn vào giấc ngủ từ lúc nhắm mắt là 15-20 phút", threadID, messageID);
			}
			else {
				if (content.indexOf(":") == -1) return api.sendMessage(`Không đúng format, hãy xem trong ${prefix}help`, threadID, messageID);
				var contentHour = content.split(":")[0];
				var contentMinute = content.split(":")[1];
				if (isNaN(contentHour) || isNaN(contentMinute) || contentHour > 23 || contentMinute > 59 || contentHour < 0 || contentMinute < 0 || contentHour.length != 2 || contentMinute.length != 2)  return api.sendMessage(`Không đúng format, hãy xem trong ${prefix}help`, threadID, messageID);				var getTime = moment().utcOffset("+07:00").format();
				var time = getTime.slice(getTime.indexOf("T") + 1, getTime.indexOf("+"));
				var hour = time.split(":")[0];
				var minute = time.split(":")[1];
				var sleepTime = getTime.replace(hour + ":", contentHour + ":").replace(minute + ":", contentMinute + ":");
				for (var i = 1; i < 7; i++) wakeTime.push(moment(sleepTime).utcOffset("+07:00").add(90 * i + 15, 'm').format("HH:mm"));
				return api.sendMessage("Nếu bạn đi ngủ vào lúc " + content + ", những thời gian hoàn hảo nhất để thức dậy là:\n" + wakeTime.join(', ') + "\nFact: Thời gian để bạn vào giấc ngủ từ lúc nhắm mắt là 15-20 phút", threadID, messageID);
			}
		}

		//sleep time calculator
		if (contentMessage.indexOf(`${prefix}wake`) == 0) {
			const moment = require("moment-timezone");
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (content.indexOf(":") == -1) return api.sendMessage(`Không đúng format, hãy xem trong ${prefix}help`, threadID, messageID);
			var sleepTime = [];
			var contentHour = content.split(":")[0];
			var contentMinute = content.split(":")[1];
			if (isNaN(contentHour) || isNaN(contentMinute) || contentHour > 23 || contentMinute > 59 || contentHour < 0 || contentMinute < 0 || contentHour.length != 2 || contentMinute.length != 2)  return api.sendMessage(`Không đúng format, hãy xem trong ${prefix}help`, threadID, messageID);
			var getTime = moment().utcOffset("+07:00").format();
			var time = getTime.slice(getTime.indexOf("T") + 1, getTime.indexOf("+"));
			var hour = time.split(":")[0];
			var minute = time.split(":")[1];
			var wakeTime = getTime.replace(hour + ":", contentHour + ":").replace(minute + ":", contentMinute + ":");
			for (var i = 6; i > 0; i--) sleepTime.push(moment(wakeTime).utcOffset("+07:00").subtract(90 * i + 15, 'm').format("HH:mm"));
			return api.sendMessage("Nếu bạn muốn thức dậy vào lúc " + content + ", những thời gian hoàn hảo nhất để đi ngủ là:\n" + sleepTime.join(', ') + "\nFact: Thời gian để bạn vào giấc ngủ từ lúc nhắm mắt là 15-20 phút", threadID, messageID);
		}

		//prefix
		if (contentMessage.indexOf(`prefix`) == 0) return api.sendMessage(`Prefix là: ${prefix}`, threadID, messageID);

		//credits
		if (contentMessage.indexOf("credits") == 0) return api.sendMessage("Project Mirai được thực hiện bởi:\nSpermLord: https://fb.me/MyNameIsSpermLord\nCatalizCS: https://fb.me/Cataliz2k\nFull source code at: https://github.com/roxtigger2003/mirai", threadID, messageID);

		//simsimi
		if (contentMessage.indexOf(`${prefix}sim`) == 0) return request(`https://simsumi.herokuapp.com/api?text=${encodeURIComponent(contentMessage.slice(prefix.length + 4, contentMessage.length))}&lang=vi`, (err, response, body) => api.sendMessage((JSON.parse(body).success != '') ? JSON.parse(body).success : 'Không có câu trả nời nào.', threadID, messageID));

		//random màu cho theme chat
		if (contentMessage == `${prefix}randomcolor`) {
			var color = ['196241301102133','169463077092846','2442142322678320', '234137870477637', '980963458735625','175615189761153','2136751179887052', '2058653964378557','2129984390566328','174636906462322','1928399724138152','417639218648241','930060997172551','164535220883264','370940413392601','205488546921017','809305022860427'];
			return api.changeThreadColor(color[Math.floor(Math.random() * color.length)], threadID, (err) => {
				if (err) return api.sendMessage('Đã có lỗi không mong muốn đã xảy ra', threadID, messageID);
			});
		}

		//poll
		if (contentMessage.indexOf(`${prefix}poll`) == 0) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			var title = content.slice(0, content.indexOf(" -> "));
			var options = content.substring(content.indexOf(" -> ") + 4)
			var option = options.split(" | ");
			var object = {};
			if (option.length == 1 && option[0].includes(' |')) option[0] = option[0].replace(' |', '');
			for (var i = 0; i < option.length; i++) object[option[i]] = false;
			return api.createPoll(title, threadID, object, (err) => {
				if (err) api.sendMessage("Có lỗi xảy ra vui lòng thử lại", threadID, messageID)
			});
		}

		//rainbow
		if (contentMessage.indexOf(`${prefix}rainbow`) == 0) {
			var value = contentMessage.slice(prefix.length + 8, contentMessage.length);
			if (isNaN(value)) return api.sendMessage('Dữ liệu không phải là một con số', threadID, messageID);
			if (value > 50) return api.sendMessage('Dữ liệu phải nhỏ hơn 50!', threadID, messageID);
			var color = ['196241301102133','169463077092846','2442142322678320', '234137870477637', '980963458735625','175615189761153','2136751179887052', '2058653964378557','2129984390566328','174636906462322','1928399724138152','417639218648241','930060997172551','164535220883264','370940413392601','205488546921017','809305022860427'];
			for (var i = 0; i < value; i++) api.changeThreadColor(color[Math.floor(Math.random() * color.length)], threadID);
			return;
		}

		//giveaway
		if (contentMessage.indexOf(`${prefix}giveaway`) == 0) {
			var content = contentMessage.slice(prefix.length + 9, contentMessage.length);
			api.getThreadInfo(threadID, function(err, info) {
				if (err) return api.sendMessage(`Đã xảy ra lỗi không mong muốn`, threadID, messageID);
				let winner = info.participantIDs[Math.floor(Math.random() * info.participantIDs.length)];
				User.getName(winner).then((name) => {
					if (err) return api.sendMessage(`Đã xảy ra lỗi không mong muốn`, threadID, messageID);
					api.sendMessage({
						body: `Yahoo ${name}, bạn đã thắng giveaway! phần thưởng là: ${content}🥳🥳.`,
						mentions: [
							{
								tag: name,
								id: winner
							}
						]
					}, threadID, messageID);
				});
			});
			return;
		}

		//thời tiết
		if (contentMessage.indexOf(`${prefix}weather`) == 0) {
			var city = contentMessage.slice(prefix.length + 8, contentMessage.length);
			if (city.length == 0) return api.sendMessage(`Bạn chưa nhập địa điểm, hãy đọc hướng dẫn tại ${prefix}help weather!`,threadID, messageID);
			request(encodeURI("https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + openweather + "&units=metric&lang=vi"), (err, response, body) => {
				if (err) throw err;
				var weatherData = JSON.parse(body);
				if (weatherData.cod !== 200) return api.sendMessage(`Địa điểm ${city} không tồn tại!`, threadID, messageID);
				var sunrise_date = moment.unix(weatherData.sys.sunrise).tz("Asia/Ho_Chi_Minh");
				var sunset_date = moment.unix(weatherData.sys.sunset).tz("Asia/Ho_Chi_Minh");
				api.sendMessage({
					body: '🌡 Nhiệt độ: ' + weatherData.main.temp + '°C' + '\n' +
								'🌡 Nhiệt độ cơ thể cảm nhận được: ' + weatherData.main.feels_like + '°C' + '\n' +
								'☁️ Bầu trời hiện tại: ' + weatherData.weather[0].description + '\n' +
								'💦 Độ ẩm: ' + weatherData.main.humidity + '%' + '\n' +
								'💨 Tốc độ gió: ' + weatherData.wind.speed + 'km/h' + '\n' +
								'🌅 Mặt trời mọc vào lúc: ' + sunrise_date.format('HH:mm:ss') + '\n' +
								'🌄 Mặt trời lặn vào lúc: ' + sunset_date.format('HH:mm:ss') + '\n',
					location: {
						latitude: weatherData.coord.lat,
						longitude: weatherData.coord.lon,
						current: true
					},
				}, threadID, messageID);
			});
			return;
		}

		//say
		if (contentMessage.indexOf(`${prefix}say`) == 0) {
			const tts = require("./modules/say");
			var content = contentMessage.slice(prefix.length + 4,contentMessage.length);
			let callback = function() {
				api.sendMessage({
					body: "",
					attachment: fs.createReadStream(__dirname + "/src/say.mp3")
				}, threadID, () => fs.unlinkSync(__dirname + "/src/say.mp3"));
			};
			if (contentMessage.indexOf("jp") == 5) tts.other(contentMessage.slice(prefix.length + 7, contentMessage.length),"ja",callback);
			else if (contentMessage.indexOf("en") == 5) tts.other(contentMessage.slice(prefix.length + 7, contentMessage.length),"en-US",callback);
			else if (contentMessage.indexOf("ko") == 5) tts.other(contentMessage.slice(prefix.length + 7, contentMessage.length),"ko",callback);
			else if (contentMessage.indexOf("ru") == 5) tts.other(contentMessage.slice(prefix.length + 7, contentMessage.length),"ru",callback);
			else tts.vn(content, callback);
			return;
		}

		//cập nhật tình hình dịch
		if (contentMessage == `${prefix}covid-19`)
			return request("https://code.junookyo.xyz/api/ncov-moh/data.json", (err, response, body) => {
				if (err) throw err;
				var data = JSON.parse(body);
				api.sendMessage(
					"Thế giới:" +
					"\n- Nhiễm: " + data.data.global.cases +
					"\n- Chết: " + data.data.global.deaths +
					"\n- Hồi phục: " + data.data.global.recovered +
					"\nViệt Nam:" +
					"\n- Nhiễm: " + data.data.vietnam.cases +
					"\n- Chết: " + data.data.vietnam.deaths +
					"\n- Phục hồi: " + data.data.vietnam.recovered,
					threadID,
					messageID
				);
			});

		//chọn
		if (contentMessage.indexOf(`${prefix}choose`) == 0) {
			var input = contentMessage.slice(prefix.length + 7, contentMessage.length).trim();
			if (!input)return api.sendMessage(`Bạn không nhập đủ thông tin kìa :(`,threadID,messageID);
			var array = input.split(" | ");
			return api.sendMessage(`Hmmmm, em sẽ chọn giúp cho là: ` + array[Math.floor(Math.random() * array.length)] + `.`,threadID,messageID);
		}

		//waifu
		if (contentMessage == `${prefix}waifu`) {
			var route = Math.round(Math.random() * 10);
			if (route == 1 || route == 0 || route == 3) {
				api.sendMessage("Dạ em sẽ làm vợ anh <3", threadID, messageID);
				api.sendMessage("Yêu chàng nhiều <3", threadID, messageID);
				return;
			}
			else if (route == 2 || route > 4) {
				api.sendMessage("Chúng ta chỉ là bạn thôi :'(", threadID, messageID);
				return;
			}
		}

		//ramdom con số
		if (contentMessage.indexOf(`${prefix}roll`) == 0) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			var splitContent = content.split(" ");
			if (splitContent == '') return api.sendMessage(`uwu con số đẹp nhất em chọn được là: ${Math.floor(Math.random() * 99)}`, threadID, messageID);
			if (splitContent.length != 2) return api.sendMessage(`Sai format, bạn hãy đọc hướng dẫn trong ${prefix}help roll để biết thêm chi tiết.`, threadID, messageID)
			var min = parseInt(splitContent[0]);
			var max = parseInt(splitContent[1]);
			if (isNaN(min) || isNaN(max)) return api.sendMessage('Dữ liệu bạn nhập không phải là một con số.', threadID, messageID);
			if (min >= max) return api.sendMessage('Oops, số kết thúc của bạn lớn hơn hoặc bằng số bắt đầu.', threadID, messageID);
			return api.sendMessage(`uwu con số đẹp nhất em chọn được là: ${Math.floor(Math.random() * (max - min + 1) + min)}`, threadID, messageID);
		}

		//Khiến bot nhái lại tin nhắn bạn
		if (contentMessage.indexOf(`${prefix}echo`) == 0) return api.sendMessage(contentMessage.slice(prefix.length + 5, contentMessage.length), threadID);

		//rank
		if (contentMessage.indexOf(`${prefix}rank`) == 0) {
			const createCard = require("../controllers/rank_card.js");
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (content.length == 0)
				(async () => {
					let name = await User.getName(senderID);
					Rank.getPoint(senderID).then(point => createCard({ id: senderID, name, ...point })).then(path => {
						api.sendMessage(
							{
								body: "",
								attachment: fs.createReadStream(path)
							},
							threadID, () => fs.unlinkSync(path), messageID
						)
					})
				})();
			else if (content.indexOf("@") !== -1)
				for (var i = 0; i < Object.keys(event.mentions).length; i++) {
					let uid = Object.keys(event.mentions)[i];
					(async () => {
						let name = await User.getName(senderID);
						Rank.getPoint(uid).then(point => createCard({ id: uid, name, ...point })).then(path => {
							api.sendMessage(
								{
									body: "",
									attachment: fs.createReadStream(path)
								},
								threadID, () => fs.unlinkSync(path), messageID
							)
						})
					})();
				}
			return;
		}

		//dịch ngôn ngữ
		if (contentMessage.indexOf(`${prefix}trans`) == 0) {
			var content = contentMessage.slice(prefix.length + 6, contentMessage.length);
			if (content.length == 0 && event.type != "message_reply") return api.sendMessage(`Bạn chưa nhập thông tin, vui lòng đọc ${prefix}help để biết thêm chi tiết!`, threadID,messageID);
			var translateThis = content.slice(0, content.indexOf(" ->"));
			var lang = content.substring(content.indexOf(" -> ") + 4);
			if (event.type == "message_reply") {
				translateThis = event.messageReply.body
				if (content.indexOf(" -> ") != -1) lang = content.substring(content.indexOf(" -> ") + 4);
				else lang = 'vi';
			}
			else if (content.indexOf(" -> ") == -1) {
				translateThis = content.slice(0, content.length)
				lang = 'vi';
			}
			return request(encodeURI(`https://translate.yandex.net/api/v1.5/tr.json/translate?key=${yandex}&text=${translateThis}&lang=${lang}`), (err, response, body) => {
				if (err) return api.sendMessage("Đã có lỗi xảy ra!", threadID, messageID)
				var retrieve = JSON.parse(body);
				var convert = retrieve.text[0];
				var splitLang = retrieve.lang.split("-");
				var fromLang = splitLang[0];
				api.sendMessage(
					`Bản dịch: ${convert}\n` +
					`${fromLang} -> ${lang}`,
					threadID, messageID
				);
			});
		}

		//châm ngôn sống
		if (contentMessage == `${prefix}quotes`) {
			var stringData = JSON.parse(fs.readFileSync(__dirname + "/src/quotes.json"));
			var randomQuotes = stringData[Math.floor(Math.random() * stringData.length)];
			return api.sendMessage('Quote:\n"' + randomQuotes.text + '"\n- ' + randomQuotes.author + ' -', threadID, messageID);
		}

		//uptime
		if (contentMessage == `${prefix}uptime`) {
			var time = process.uptime();
			var minutes = Math.floor((time % (60 * 60)) / 60);
			var seconds = Math.floor(time % 60);
			api.sendMessage(
				"Bot đã hoạt động được " +
				minutes + " phút " +
				seconds + " giây." +
				"\nLưu ý: Bot sẽ tự động restart sau khi 10 phút hoạt động!",
				threadID, messageID
			);
			return;
		}

		//unsend message
		if (contentMessage.indexOf(`${prefix}gỡ`) == 0) {
			if (event.messageReply.senderID != api.getCurrentUserID()) return api.sendMessage("Không thể gỡ tin nhắn của người khác", threadID, messageID);
			if (event.type != "message_reply") return api.sendMessage("Phản hồi tin nhắn cần gỡ", threadID, messageID);
			return api.unsendMessage(event.messageReply.messageID, err => {
				if (err) api.sendMessage("Không thể gỡ tin nhắn này vì đã quá 10 phút!", threadID, messageID);
			});
		}

		//get uid
		if (contentMessage.indexOf(`${prefix}uid`) == 0) {
			var content = contentMessage.slice(prefix.length + 4, contentMessage.length);
			if (!content) return api.sendMessage(`${senderID}`, threadID, messageID);
			else if (content.indexOf("@") !== -1) {
				for (var i = 0; i < Object.keys(event.mentions).length; i++) api.sendMessage(`${Object.keys(event.mentions)[i]}`, threadID, messageID);
				return;
			}
		}

		//wiki
		if (contentMessage.indexOf(`${prefix}wiki`) == 0) {
			const wiki = require("wikijs").default;
			var url = 'https://vi.wikipedia.org/w/api.php';
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (contentMessage.indexOf("-en") == 6) {
				url = 'https://en.wikipedia.org/w/api.php';
				content = contentMessage.slice(prefix.length + 9, contentMessage.length);
			}
			if (!content) return api.sendMessage("Nhập thứ cần tìm!", threadID, messageID);
			wiki({apiUrl: url}).page(content).catch((err) => api.sendMessage("Không tìm thấy " + content, threadID, messageID)).then(page => {
				if (typeof page == 'undefined') return;
				Promise.resolve(page.summary()).then(val => api.sendMessage(val, threadID, messageID));
			});
			return;
		}

		//ping
		if (contentMessage == `${prefix}ping`)
			return api.getThreadInfo(threadID, function(err, info) {
				if (err) throw err;
				let ids = info.participantIDs;
				let botid = api.getCurrentUserID();
				let callid = {
					body: "Ping🏓",
					mentions: [
						{
							tag: `${botid}`,
							id: botid
						}
					]
				};
				ids.forEach(getid => {
					if (id != botid) {
						var addthis = {
							tag: `${id}`,
							id: id
						}
						callid["mentions"].push(addthis);
					}
				});
				api.sendMessage(callid, threadID, messageID);
			});

		//look earth
		if (contentMessage.indexOf(`${prefix}earth`) == 0)
			return request(`https://api.nasa.gov/EPIC/api/natural/images?api_key=DEMO_KEY`, (err, response, body) => {
				if (err) throw err;
				var jsonData = JSON.parse(body);
				var randomNumber = Math.floor(Math.random() * ((jsonData.length -1) + 1));
				var image_name = jsonData[randomNumber].image
				var date = jsonData[randomNumber].date;
				var date_split = date.split("-")
				var year = date_split[0];
				var month = date_split[1];
				var day_and_time = date_split[2];
				var sliced_date = day_and_time.slice(0, 2);
				var image_link = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${sliced_date}/png/` + image_name + ".png";
				let callback = function() {
					api.sendMessage({
						body: `${jsonData[randomNumber].caption} on ${date}`,
						attachment: fs.createReadStream(__dirname + `/src/randompic.png`)
					}, threadID, () => fs.unlinkSync(__dirname + `/src/randompic.png`), messageID);
				};
				request(image_link).pipe(fs.createWriteStream(__dirname + `/src/randompic.png`)).on("close", callback);
			});

		//localtion iss
		if (contentMessage.indexOf(`${prefix}iss`) == 0) {
			return request(`http://api.open-notify.org/iss-now.json`, (err, response, body) => {
				if (err) throw err;
				var jsonData = JSON.parse(body);
				var position = jsonData["iss_position"];
				var latitude = position["latitude"];
				var longitude = position["longitude"];
				api.sendMessage(`Vị trí hiện tại của International Space Station 🌌🌠🌃\nVĩ độ: ${latitude} | Kinh độ: ${longitude}`, threadID, messageID);
			});
		}

		//near-earth obj
		if (contentMessage.indexOf(`${prefix}neo`) == 0) {
			return request(`https://api.nasa.gov/neo/rest/v1/feed/today?detailed=true&api_key=DEMO_KEY`, (err, response, body) => {
				if (err) throw err;
				var jsonData = JSON.parse(body);
				var total = jsonData.element_count;
				api.sendMessage(`Hiện tại đang có tổng cộng: ${total} vật thể đang ở gần trái đất ngay lúc này!`, threadID, messageID);
			});
		}

		//spacex
		if (contentMessage.indexOf(`${prefix}spacex`) == 0) {
			return request(`https://api.spacexdata.com/v3/launches/latest`, (err, response, body) => {
				if (err) throw err;
				var data = JSON.parse(body);
				api.sendMessage(
					"Thông tin đợt phóng mới nhất của SpaceX:" +
					"\n- Mission: " + data.mission_name +
					"\n- Năm phóng: " + data.launch_year +
					"\n- Thời gian phóng: " + data.launch_date_local +
					"\n- Tên lửa: " + data.rocket.rocket_name +
					"\n- Link Youtube: " + data.links.video_link,
				threadID,messageID
				);
			});
		}

		//acronym
		if (contentMessage.indexOf(`${prefix}acronym`) == 0) {
			var content = contentMessage.slice(prefix.length + 8, contentMessage.length);
			if (!content) return api.sendMessage(`Bạn chưa thêm từ viết tắt cần tìm kiếm!`, threadID, messageID);
			var acronym_uri = `http://acronyms.silmaril.ie/cgi-bin/xaa?${content}`;
			var acronym_meanings = [];
			return request(acronym_uri, { json: true }, (err, res, body) => {
				if (err) throw err;
				var split_body = body.split("\n");
				var num_acronyms = split_body[4];
				if (num_acronyms.includes("0")) api.sendMessage("Không tìm thấy từ viết tắt này trong từ điển.", threadID, messageID);
				else {
					for (var i = 6; i < split_body.length - 1; i += 4) {
						var line = split_body[i];
						line = line.trim();
						var split_acr_array = line.split(" ");
						var first_item = split_acr_array[0];
						if (split_acr_array.length === 1) {
							first_item = first_item.slice(7, first_item.length - 8);
							split_acr_array[0] = first_item;
						}
						else {
							var strpd_item = first_item.slice(7, first_item.length + 5);
							split_acr_array[0] = strpd_item;
							var last_item = split_acr_array[split_acr_array.length - 1];
							var strpd_last_item = last_item.slice(0, split_acr_array.length - 11);
							split_acr_array[split_acr_array.length - 1] = strpd_last_item;
						}
						var final_acronym = split_acr_array.toString();
						final_acronym = final_acronym.split(",").join(" ");
						acronym_meanings.push(final_acronym);
					}
					api.sendMessage(`Nghĩa của từ viết tắt '${content}' là:\n ` + acronym_meanings.join("\n - ") + `.`, threadID, messageID);
				};
			});
		}

		/* ==================== Study Commands ==================== */

		//toán học
		if (contentMessage.indexOf(`${prefix}math`) == 0) {
			const wolfram = "http://api.wolframalpha.com/v2/result?appid=" + wolfarm + "&i=";
			var m = contentMessage.slice(prefix.length + 5, contentMessage.length);
			var l = "http://lmgtfy.com/?q=" + m.replace(/ /g, "+");
			request(wolfram + encodeURIComponent(m), function(err, response, body) {
				if (body.toString() === "Wolfram|Alpha did not understand your input") return api.sendMessage(l, threadID, messageID);
				else if (body.toString() === "Wolfram|Alpha did not understand your input") return api.sendMessage("Tôi không hiểu câu hỏi của bạn", threadID, messageID);
				else if (body.toString() === "My name is Wolfram Alpha.") return api.sendMessage("Tên tôi là Mirai", threadID, messageID);
				else if (body.toString() === "I was created by Stephen Wolfram and his team.") return api.sendMessage("Tôi được làm ra bởi CatalizCS và SpermLord", threadID, messageID);
				else if (body.toString() === "I am not programmed to respond to this dialect of English.") return api.sendMessage("Tôi không được lập trình để nói những thứ như này", threadID, messageID);
				else if (body.toString() === "StringJoin(CalculateParse`Content`Calculate`InternetData(Automatic, Name))") return api.sendMessage("Tôi không biết phải trả lời như nào", threadID, messageID);
				else return api.sendMessage(body, threadID, messageID);
			});
		}

		//cân bằng phương trình hóa học
		if (contentMessage.indexOf(`${prefix}chemeb`) == 0) {
			console.log = function() {}; //Disable console.log() in this command.
			const chemeb = require('chem-eb');
			if (event.type == "message_reply") {
				var msg = event.messageReply.body;
				if (msg.includes('(') && msg.includes(')')) return api.sendMessage('Hiện tại không hỗ trợ phương trình tối giản. Hãy chuyển (XY)z về dạng XzYz.', threadID, messageID);
				var balanced = chemeb(msg);
				return api.sendMessage(`✅ ${balanced.outChem}`, threadID, messageID);
			}
			else {
				var msg = contentMessage.slice(prefix.length + 7, contentMessage.length);
				if (msg.includes('(') && msg.includes(')')) return api.sendMessage('Hiện tại không hỗ trợ phương trình tối giản. Hãy chuyển (XY)z về dạng XzYz.', threadID, messageID);
				var balanced = chemeb(msg);
				return api.sendMessage(`✅ ${balanced.outChem}`, threadID, messageID);
			}
		}

	/* ==================== NSFW Commands ==================== */

		//nhentai ramdom code
		if (contentMessage == `${prefix}nhentai -r`) return api.sendMessage((__GLOBAL.NSFWBlocked.includes(threadID)) ? 'Nhóm này đang bị tắt NSFW!' : `Code lý tưởng của nii-chan là: ${Math.floor(Math.random() * 99999)}`, threadID, messageID);

		//nhentai search
		if (contentMessage.indexOf(`${prefix}nhentai -i`) == 0) {
			if (__GLOBAL.NSFWBlocked.includes(threadID)) return api.sendMessage("Nhóm này đang bị tắt NSFW!", threadID, messageID);
			let id = contentMessage.slice(prefix.length + 11, contentMessage.length).trim();
			if (!id) return api.sendMessage("Nhập id!", threadID, messageID);
			return request(`https://nhentai.net/api/gallery/${id}`, (error, response, body) => {
				var codeData = JSON.parse(body);
				if (codeData.error == true) return api.sendMessage("Không tìm thấy truyện này", threadID, messageID);
				let title = codeData.title.pretty;
				let tagList = [];
				let artistList = [];
				let characterList = [];
				codeData.tags.forEach(item => {
					if (item.type == "tag") tagList.push(item.name);
					else if (item.type == "artist") artistList.push(item.name);
					else if (item.type == 'character') characterList.push(item.name);
				});
				var tags = tagList.join(', ');
				var artists = artistList.join(', ');
				var characters = characterList.join(', ');
				if (characters == '') characters = 'Original';
				return api.sendMessage("Tiêu đề: " + title, threadID, () => {
					api.sendMessage("Tác giả: " + artists, threadID, () => {
						api.sendMessage("Nhân vật: " + characters, threadID, () => {
							api.sendMessage("Tags: " + tags, threadID, () => {
								api.sendMessage("Link: https://nhentai.net/g/" + id, threadID);
							});
						});
					});
				}, messageID);
			});
		}

		//hentaivn
		if (contentMessage.indexOf(`${prefix}hentaivn -i`) == 0) {
			if (__GLOBAL.NSFWBlocked.includes(threadID)) return api.sendMessage("Nhóm này đang bị tắt NSFW!", threadID, messageID);
			return api.sendMessage('Hiện tại HentaiVN đã đổi cách hoạt động của trang: Kiểm tra trình duyệt + IP hợp lệ và phải qua bước xác thực bằng hình ảnh thì mới cho vào.\nHiện tại SpermLord vẫn chưa tìm ra cách vượt, nên sẽ tạm thời tắt tính năng này.', threadID, messageID);
			const cheerio = require('cheerio');
			var id = contentMessage.slice(prefix.length + 12, contentMessage.length);
			if (!id) return api.sendMessage("Nhập id!", threadID, messageID);
			axios.get(`https://hentaivn.net/id${id}`).then((response) => {
				if (response.status == 200) {
					const html = response.data;
					const $ = cheerio.load(html);
					var getContainer = $('div.container');
					var getURL = getContainer.find('form').attr('action');
					if (getURL == `https://hentaivn.net/${id}-doc-truyen-.html`) return api.sendMessage("Không tìm thấy truyện này", threadID, messageID);
					axios.get(getURL).then((response) => {
						if (response.status == 200) {
							const html = response.data;
							const $ = cheerio.load(html);
							var getInfo = $('div.container div.main div.page-info');
							var getUpload = $('div.container div.main div.page-uploader');
							var getName = getInfo.find('h1').find('a').text();
							var getTags = getInfo.find('a.tag').contents().map(function() {
								return (this.type === 'text') ? $(this).text() + '' : '';
							}).get().join(', ');
							var getArtist = getInfo.find('a[href^="/tacgia="]').contents().map(function () {
								return (this.type === 'text') ? $(this).text() + '' : '';
							}).get().join(', ');
							var getChar = getInfo.find('a[href^="/char="]').contents().map(function () {
								return (this.type === 'text') ? $(this).text() + '' : '';
							}).get().join(', ');
							if (getChar == '') getChar = 'Original';
							var getLikes = getUpload.find('div.but_like').text();
							var getDislikes = getUpload.find('div.but_unlike').text();
							return api.sendMessage("Tên: " + getName.substring(1), threadID, () => {
								api.sendMessage("Tác giả: " + getArtist, threadID, () => {
									api.sendMessage("Nhân vật: " + getChar, threadID, () => {
										api.sendMessage("Tags: " + getTags, threadID, () => {
											api.sendMessage("Số Like: " + getLikes.substring(1) + "\nSố Dislike: " + getDislikes.substring(1), threadID, () => {
												api.sendMessage(getURL.slice(0, 17) + " " + getURL.slice(17), threadID);
											});
										});
									});
								});
							}, messageID);
						}
					}, (error) => console.log(error));
				}
			}, (error) => console.log(error));
			return;
		}

		//porn pics
		if (contentMessage.indexOf(`${prefix}porn`) == 0) {
			if (__GLOBAL.NSFWBlocked.includes(threadID)) return api.sendMessage("Nhóm này đang bị tắt NSFW!", threadID, messageID);
			return Economy.pornUseLeft(senderID).then(useLeft => {
				if (useLeft == 0) return api.sendMessage(`Bạn đã hết số lần dùng ${prefix}porn.\nHãy nâng cấp lên Hạng NSFW cao hơn hoặc chờ đến ngày mai.`, threadID, messageID);
				const cheerio = require('cheerio');
				const ffmpeg = require("fluent-ffmpeg");
				const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
				ffmpeg.setFfmpegPath(ffmpegPath);
				var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
				var album = {
					'asian': "9057591",
					'ass': "2830292",
					'bdsm': "17510771",
					'bj': "3478991",
					'boobs': "15467902",
					'cum': "1036491",
					'feet': "852341",
					'gay': "19446301",
					'pornstar': "20404671",
					'pussy': "1940602",
					'sex': "2132332",
					'teen': "17887331"
				};
				if (!content || !album.hasOwnProperty(content)) {
					let allTags = [];
					Object.keys(album).forEach((item) => allTags.push(item));
					var pornTags = allTags.join(', ');
					return api.sendMessage('=== Tất cả các tag Porn ===\n' + pornTags, threadID, messageID);
				}
				axios.get(`https://www.pornhub.com/album/${album[content]}`).then((response) => {
					if (useLeft != -1) Economy.subtractPorn(senderID);
					if (response.status == 200) {
						const html = response.data;
						const $ = cheerio.load(html);
						var result = [];
						let list = $('ul.photosAlbumsListing li.photoAlbumListContainer div.photoAlbumListBlock');
						list.map(index => {
							let item = list.eq(index);
							if (!item.length) return;
							let photo = `${item.find('a').attr('href')}`;
							result.push(photo);
						});
						let getURL = "https://www.pornhub.com" + result[Math.floor(Math.random() * result.length)];
						axios.get(getURL).then((response) => {
							if (response.status == 200) {
								const html = response.data;
								const $ = cheerio.load(html);
								if (content == 'sex') {
									let video = $('video.centerImageVid');
									let mp4URL = video.find('source').attr('src');
									let ext = mp4URL.substring(mp4URL.lastIndexOf('.') + 1);
									request(mp4URL).pipe(fs.createWriteStream(__dirname + `/src/porn.${ext}`)).on('close', () => {
										ffmpeg().input(__dirname + `/src/porn.${ext}`).toFormat("gif").pipe(fs.createWriteStream(__dirname + "/src/porn.gif")).on("close", () => {
											return api.sendMessage({
												body: "",
												attachment: fs.createReadStream(__dirname + `/src/porn.gif`)
											}, threadID, () => {
												fs.unlinkSync(__dirname + `/src/porn.gif`);
												fs.unlinkSync(__dirname + `/src/porn.${ext}`);
											}, messageID);
										});
									});
								}
								else {
									let image = $('div#photoWrapper');
									let imgURL = image.find('img').attr('src');
									let ext = imgURL.substring(imgURL.lastIndexOf('.') + 1);
									request(imgURL).pipe(fs.createWriteStream(__dirname + `/src/porn.${ext}`)).on('close', () => {
										return api.sendMessage({
											body: "",
											attachment: fs.createReadStream(__dirname + `/src/porn.${ext}`)
										}, threadID, () => fs.unlinkSync(__dirname + `/src/porn.${ext}`), messageID);
									});
								}
							}
						}, (error) => console.log(error));
					}
					else return api.sendMessage("Đã xảy ra lỗi!", threadID, messageID);
				}, (error) => console.log(error));
			});
		}

		//hentai
		if (contentMessage.indexOf(`${prefix}hentai`) == 0) {
			if (__GLOBAL.NSFWBlocked.includes(threadID)) return api.sendMessage("Nhóm này đang bị tắt NSFW!", threadID, messageID);
			return Economy.hentaiUseLeft(senderID).then(useLeft => {
				if (useLeft == 0) return api.sendMessage(`Bạn đã hết số lần dùng ${prefix}hentai.\nHãy nâng cấp lên Hạng NSFW cao hơn hoặc chờ đến ngày mai.`, threadID, messageID);
				var content = contentMessage.slice(prefix.length + 7, contentMessage.length);
				var jsonData = fs.readFileSync(__dirname + "/src/anime.json");
				var data = JSON.parse(jsonData).nsfw;
				if (!content || !data.hasOwnProperty(content)) {
					let nsfwList = [];
					Object.keys(data).forEach(endpoint => nsfwList.push(endpoint));
					let nsfwTags = nsfwList.join(', ');
					return api.sendMessage('=== Tất cả các tag Hentai ===\n' + nsfwTags, threadID, messageID);
				}
				request(data[content], (error, response, body) => {
					if (useLeft != -1) Economy.subtractHentai(senderID);
					let picData = JSON.parse(body);
					let getURL = picData.url;
					let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + `/src/hentai.${ext}`)
						}, threadID, () => fs.unlinkSync(__dirname + `/src/hentai.${ext}`), messageID);
					};
					request(getURL).pipe(fs.createWriteStream(__dirname + `/src/hentai.${ext}`)).on("close", callback);
				});
			});
		}

		//get nsfw tier
		if (contentMessage == `${prefix}mynsfw`) {
			if (__GLOBAL.NSFWBlocked.includes(threadID)) return api.sendMessage("Nhóm này đang bị tắt NSFW!", threadID, messageID);
			(async () => {
				let tier = await Economy.getNSFW(senderID);
				let hentai = await Economy.hentaiUseLeft(senderID);
				let porn = await Economy.pornUseLeft(senderID);
				if (tier == -1) api.sendMessage('Bạn đang ở God Mode.\nBạn sẽ không bị giới hạn số lần dùng lệnh NSFW.', threadID, messageID);
				else api.sendMessage(`Hạng NSFW của bạn là ${tier}.\nSố lần sử dụng ${prefix}porn còn lại: ${porn}.\nSố lần sử dụng ${prefix}hentai còn lại: ${hentai}.`, threadID, messageID);
			})();
			return;
		}

		//buy nsfw tier
		if (contentMessage == `${prefix}buynsfw`) {
			if (__GLOBAL.NSFWBlocked.includes(threadID)) return api.sendMessage("Nhóm này đang bị tắt NSFW!", threadID, messageID);
			(async () => {
				let tier = await Economy.getNSFW(senderID);
				if (tier == -1) api.sendMessage('Bạn đang ở God Mode nên sẽ không thể mua.', threadID, messageID);
				else {
					let buy = await Economy.buyNSFW(senderID);
					if (buy == false) api.sendMessage('Đã có lỗi xảy ra!', threadID, messageID);
					else api.sendMessage(buy.toString(), threadID, messageID);
				}
			})();
			return;
		}

		//set nsfw tier
		if (contentMessage.indexOf(`${prefix}setnsfw`) == 0 && admins.includes(senderID)) {
			if (__GLOBAL.NSFWBlocked.includes(threadID)) return api.sendMessage("Nhóm này đang bị tắt NSFW!", threadID, messageID);
			var mention = Object.keys(event.mentions)[0];
			var content = contentMessage.slice(prefix.length + 8,contentMessage.length);
			var sender = content.slice(0, content.lastIndexOf(" "));
			var tierSet = content.substring(content.lastIndexOf(" ") + 1);
			return Economy.getMoney(senderID).then((moneydb) => {
				if (isNaN(tierSet)) return api.sendMessage('Số hạng NSFW cần set của bạn không phải là 1 con số!', threadID, messageID);
				if (tierSet > 5 || tierSet < -1) return api.sendMessage('Hạng NSFW không được dưới -1 và vượt quá 5', threadID, messageID);
				if (tierSet == -1 && nsfwGodMode == false) return api.sendMessage('Bạn chưa bật NSFW God Mode trong config.', threadID, messageID);
				if (!mention && sender == 'me' && tierSet != -1) return api.sendMessage("Đã sửa hạng NSFW của bản thân thành " + tierSet, threadID, () => Economy.setNSFW(senderID, parseInt(tierSet)), messageID);
				if (!mention && sender == 'me' && tierSet == -1) return api.sendMessage("Đã bật God Mode cho bản thân!\nBạn sẽ không bị trừ số lần sử dụng lệnh NSFW.", threadID, () => Economy.setNSFW(senderID, parseInt(tierSet)), messageID);
				if (sender != 'me' && tierSet != -1)
					api.sendMessage(
						{
							body: `Bạn đã sửa hạng NSFW của ${event.mentions[mention].replace("@", "")} thành ${tierSet}.`,
							mentions: [
								{
									tag: event.mentions[mention].replace("@", ""),
									id: mention
								}
							]
						},
						threadID,
						() => Economy.setNSFW(mention, parseInt(tierSet)),
						messageID
					);
				if (senderID != 'me' && tierSet == -1)
					api.sendMessage(
						{
							body: `Bạn đã bật God Mode cho ${event.mentions[mention].replace("@", "")}!\nGiờ người này có thể dùng lệnh NSFW mà không bị giới hạn!`,
							mentions: [
								{
									tag: event.mentions[mention].replace("@", ""),
									id: mention
								}
							]
						},
						threadID,
						() => Economy.setNSFW(mention, parseInt(tierSet)),
						messageID
					);
			});
		}

		/* ==================== Economy and Minigame Commands ==================== */

		//coinflip
		if (contentMessage.indexOf(`${prefix}coinflip`) == 0) {
			if (Math.floor(Math.random() * Math.floor(2)) === 0) return api.sendMessage("Mặt ngửa!", threadID, messageID);
			else return api.sendMessage("Mặt sấp!", threadID, messageID);
		}

		//money
		if (contentMessage.indexOf(`${prefix}money`) == 0) {
			var content = contentMessage.slice(prefix.length + 8, contentMessage.length);
			var mention = Object.keys(event.mentions)[0];
			if (!content) return Economy.getMoney(senderID).then((moneydb) => api.sendMessage(`Số tiền của bạn hiện đang có là: ${moneydb} đô`, threadID, messageID));
			else if (content.indexOf("@") !== -1)
				return Economy.getMoney(mention).then((moneydb) => {
					api.sendMessage(
						{
							body: `Số tiền của ${event.mentions[mention].replace("@", "")} hiện đang có là: ${moneydb} đô.`,
							mentions: [
								{
									tag: event.mentions[mention].replace("@", ""),
									id: mention
								}
							]
						},
						threadID,
						messageID
					);
				});
		}

		//daily gift
		if (contentMessage.indexOf(`${prefix}daily`) == 0) {
			let cooldown = 8.64e7; //86400000
			Economy.getDailyTime(senderID).then((lastDaily) => {
				if (lastDaily !== null && cooldown - (Date.now() - lastDaily) > 0) {
					let time = ms(cooldown - (Date.now() - lastDaily));
					api.sendMessage(
						"Bạn đã nhận phần thưởng của ngày hôm nay, vui lòng quay lại sau: " +
						time.hours + " giờ " +
						time.minutes + " phút " +
						time.seconds + " giây ",
						threadID, messageID
					);
				}
				else {
					api.sendMessage(
						"Bạn đã nhận phần thưởng của ngày hôm nay. Cố gắng lên nhé <3",
						threadID,
						() => {
							Economy.addMoney(senderID, 200);
							Economy.updateDailyTime(senderID, Date.now());
							modules.log("User: " + senderID + " nhận daily thành công!");
						},
						messageID
					);
				}
			});
			return;
		}

		if (contentMessage == `${prefix}work`) {
			return Economy.getWorkTime(senderID).then((lastWork) => {
				let cooldown = 1200000;
				if (lastWork !== null && cooldown - (Date.now() - lastWork) > 0) {
					let time = ms(cooldown - (Date.now() - lastWork));
					api.sendMessage(
						"Bạn đã thăm ngàn, để tránh bị kiệt sức vui lòng quay lại sau: " +
						time.minutes + " phút " +
						time.seconds + " giây ",
						threadID,
						messageID
					);
				}
				else {
					let job = [
						"bán vé số",
						"sửa xe",
						"lập trình",
						"hack facebook",
						"thợ sửa ống nước ( ͡° ͜ʖ ͡°)",
						"đầu bếp",
						"thợ hồ",
						"fake taxi",
						"gangbang người khác",
						"re sờ chym mờ",
						"bán hàng online",
						"nội trợ",
						"vả mấy thằng sao đỏ, giun vàng",
						"bán hoa",
						"tìm jav/hentai code cho SpermLord",
						"chơi Yasuo trong rank và gánh team"
					];
					let amount = Math.floor(Math.random() * 400);
					api.sendMessage(`Bạn đã làm công việc: "${job[Math.floor(Math.random() * job.length)]}" và đã nhận được số tiền là: ${amount} đô`, threadID, () => {
						Economy.addMoney(senderID, parseInt(amount));
						Economy.updateWorkTime(senderID, Date.now());
						modules.log("User: " + senderID + " nhận job thành công!");
					}, messageID);
				}
			});
		}

		//roulette
		if (contentMessage.indexOf(`${prefix}roul`) == 0) {
			Economy.getMoney(senderID).then((moneydb) => {
				var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
				if (!content) return api.sendMessage(`Bạn chưa nhập thông tin đặt cược!`, threadID, messageID);
				var string = content.split(" ");
				var color = string[0];
				var money = string[1];
				var moneyWin = "";
				function isOdd(num) {
					if (num % 2 == 0) return false;
					else if (num % 2 == 1) return true;
				}
				let random = Math.floor(Math.random() * 37);
				if (isNaN(money)|| money.indexOf("-") !== -1) return api.sendMessage(`Số tiền đặt cược của bạn không phải là một con số, vui lòng xem lại cách sử dụng tại ${prefix}help roul`, threadID, messageID);
				if (!money || !color) return api.sendMessage("Sai format", threadID, messageID);
				if (money > moneydb) return api.sendMessage(`Số tiền của bạn không đủ`, threadID, messageID);
				if (money < 50) return api.sendMessage(`Số tiền đặt cược của bạn quá nhỏ, tối thiểu là 50 đô!`, threadID, messageID);
				if (color == "b" || color.includes("black")) color = 0;
				else if (color == "r" || color.includes("red")) color = 1;
				else if (color == "g" || color.includes("green")) color = 2;
				else return api.sendMessage("Bạn chưa nhập thông tin cá cược!, red [1.5x] black [2x] green [15x]", threadID, messageID);
				if (random == 0) api.sendMessage("Màu 💚", threadID, messageID);
				else if (isOdd(random)) api.sendMessage("Màu ❤️", threadID, messageID);
				else if (!isOdd(random)) api.sendMessage("Màu 🖤", threadID, messageID);
				if (random == 0 && color == 2) {
					money *= 15;
					api.sendMessage(`Bạn đã chọn màu 💚, bạn đã thắng với số tiền được nhân lên 15: ${money} đô. Số tiền hiện tại bạn có: ${moneydb + money}`, threadID, () => Economy.addMoney(senderID, parseInt(money)), messageID);
					modules.log(`${senderID} Won ${money} on green`);
				}
				else if (isOdd(random) && color == 1) {
					money *= 1.5;
					api.sendMessage(`Bạn đã chọn màu ❤️, bạn đã thắng với số tiền nhân lên 1.5: ${money} đô. Số tiền hiện tại bạn có: ${moneydb + money}`, threadID, () => Economy.addMoney(senderID, parseInt(money)), messageID);
					modules.log(`${senderID} Won ${money} on red`);
				}
				else if (!isOdd(random) && color == 0) {
					money *= 2;
					api.sendMessage(`Bạn đã chọn màu 🖤️, bạn đã thắng với số tiền nhân lên 2: ${money} đô. Số tiền hiện tại bạn có: ${moneydb + money}`, threadID, () => Economy.addMoney(senderID, parseInt(money)), messageID);
					modules.log(`${senderID} Won ${money} on black`);
				}
				else api.sendMessage(`Bạn đã ra đê ở và mất trắng số tiền: ${money} đô. Số tiền hiện tại bạn có: ${moneydb}`, threadID, () => Economy.subtractMoney(senderID, parseInt(money)), messageID);
			});
			return;
		}

		//slot
		if (contentMessage.indexOf(`${prefix}sl`) == 0) {
			const slotItems = ["🍇", "🍉", "🍊", "🍏", "7⃣", "🍓", "🍒", "🍌", "🥝", "🥑", "🌽"];
			Economy.getMoney(senderID).then((moneydb) => {
				var content = contentMessage.slice(prefix.length + 3, contentMessage.length);
				if (!content) return api.sendMessage(`Bạn chưa nhập thông tin đặt cược!`, threadID, messageID);
				var string = content.split(" ");
				var money = string[0];
				let win = false;
				if (isNaN(money)|| money.indexOf("-") !== -1) return api.sendMessage(`Số tiền đặt cược của bạn không phải là một con số, vui lòng xem lại cách sử dụng tại ${prefix}help sl`, threadID, messageID);
				if (!money) return api.sendMessage("Chưa nhập số tiền đặt cược!", threadID, messageID);
				if (money > moneydb) return api.sendMessage(`Số tiền của bạn không đủ`, threadID, messageID);
				if (money < 50) return api.sendMessage(`Số tiền đặt cược của bạn quá nhỏ, tối thiểu là 50 đô!`, threadID, messageID);
				let number = [];
				for (i = 0; i < 3; i++) number[i] = Math.floor(Math.random() * slotItems.length);
				if (number[0] == number[1] && number[1] == number[2]) {
					money *= 9;
					win = true;
				}
				else if (number[0] == number[1] || number[0] == number[2] || number[1] == number[2]) {
					money *= 2;
					win = true;
				}
				if (win) api.sendMessage(`${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]}\n\nBạn đã thắng, toàn bộ ${money} đô thuộc về bạn. Số tiền hiện tại bạn có: ${moneydb + money}`, threadID, () => Economy.addMoney(senderID, parseInt(money)), messageID);
				else api.sendMessage(`${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]}\n\nBạn đã thua, toàn bộ ${money} đô bay vào không trung xD. Số tiền hiện tại bạn có: ${moneydb - money}`, threadID, () => Economy.subtractMoney(senderID, parseInt(money)), messageID);
			});
			return;
		}

		//pay
		if (contentMessage.indexOf(`${prefix}pay`) == 0) {
			var mention = Object.keys(event.mentions)[0];
			var content = contentMessage.slice(prefix.length + 4,contentMessage.length);
			var moneyPay = content.substring(content.lastIndexOf(" ") + 1);
			Economy.getMoney(senderID).then((moneydb) => {
				if (!moneyPay) return api.sendMessage("Bạn chưa nhập số tiền cần chuyển!", threadID, messageID);
				if (isNaN(moneyPay) || moneyPay.indexOf("-") !== -1) return api.sendMessage(`Số tiền bạn nhập không hợp lệ, vui lòng xem lại cách sử dụng tại ${prefix}help pay`, threadID, messageID);
				if (moneyPay > moneydb) return api.sendMessage('Số tiền mặt trong người bạn không đủ, vui lòng kiểm tra lại số tiền bạn đang có!', threadID, messageID);
				if (moneyPay < 50) return api.sendMessage(`Số tiền cần chuyển của bạn quá nhỏ, tối thiểu là 50 đô!`, threadID, messageID);
				api.sendMessage(
					{
						body: `Bạn đã chuyển ${moneyPay} đô cho ${event.mentions[mention].replace("@", "")}.`,
						mentions: [
							{
								tag: event.mentions[mention].replace("@", ""),
								id: mention
							}
						]
					},
					threadID,
					() => {
						Economy.addMoney(mention, parseInt(moneyPay));
						Economy.subtractMoney(senderID, parseInt(moneyPay));
					},
					messageID
				);
			});
			return;
		}

		//setmoney
		if (contentMessage.indexOf(`${prefix}setmoney`) == 0 && admins.includes(senderID)) {
			var mention = Object.keys(event.mentions)[0];
			var content = contentMessage.slice(prefix.length + 9,contentMessage.length);
			var sender = content.slice(0, content.lastIndexOf(" "));
			var moneySet = content.substring(content.lastIndexOf(" ") + 1);
			if (isNaN(moneySet)) return api.sendMessage('Số tiền cần set của bạn không phải là 1 con số!', threadID, messageID);
			if (!mention && sender == 'me') return api.sendMessage("Đã sửa tiền của bản thân thành " + moneySet, threadID, () => Economy.setMoney(senderID, parseInt(moneySet)), messageID);
			api.sendMessage(
				{
					body: `Bạn đã sửa tiền của ${event.mentions[mention].replace("@", "")} thành ${moneySet} đô.`,
					mentions: [
						{
							tag: event.mentions[mention].replace("@", ""),
							id: mention
						}
					]
				},
				threadID,
				() => Economy.setMoney(mention, parseInt(moneySet)),
				messageID
			);
			return;
		}

	/* ==================== Media Commands ==================== */
		//get video facebook
		if (contentMessage.indexOf(`${prefix}facebook -p`) == 0) {
			var content = contentMessage.slice(prefix.length + 12, contentMessage.length);
			const media = require("./modules/media");
			if (!content) return api.sendMessage(`Bạn chưa nhập thông tin cần thiết!`, threadID, messageID);
			api.sendMessage("Đợi em một xíu...", threadID, messageID);
			require("fb-video-downloader").getInfo(content).then(info => {
				let gg = JSON.stringify(info);
				let data = JSON.parse(gg);
				media.facebookVideo(data.download.sd, () => {
					api.sendMessage({
						body: "",
						attachment: fs.createReadStream(__dirname + "/src/video.mp4")
					}, threadID, () => fs.unlinkSync(__dirname + "/src/video.mp4"));
				});
			});
			return;
		}

		//get video youtube
		if (contentMessage.indexOf(`${prefix}youtube -p`) == 0) {
			const media = require("./modules/media");
			var content = contentMessage.slice(prefix.length + 11, contentMessage.length);
			const ytdl = require("ytdl-core");
			if (!content) return api.sendMessage("Bạn chưa nhập thông tin cần thiết!", threadID, messageID);
			if (content.indexOf('https') == -1 || content.indexOf('http') == -1) {
				request(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=${googleSearch}&q=${encodeURIComponent(content)}`, (err, response, body) => {
					if (err) return api.sendMessage("Lỗi rồi :|", threadID, messageID);;
					var retrieve = JSON.parse(body);
					var content = "https://www.youtube.com/watch?v=" + retrieve.items[0].id.videoId;
					var title = retrieve.items[0].snippet.title;
					var thumbnails = retrieve.items[0].snippet.thumbnails.high.url;
					let callback = function() {
						api.sendMessage(
							title,
							threadID,
							() => {
								api.sendMessage({
									body: ``,
									attachment: fs.createReadStream(__dirname + "/src/thumbnails.png")
								}, threadID, () => {
									fs.unlinkSync(__dirname + "/src/thumbnails.png");
									api.sendMessage(content, threadID, () => getVideo(content));
								});
							}, messageID
						);
					};
					request(thumbnails).pipe(fs.createWriteStream(__dirname + `/src/thumbnails.png`)).on("close", callback);
				});
			}
			else getVideo(content);
			function getVideo(content) {
				ytdl.getInfo(content, function(err, info) {
					if (err) return api.sendMessage('Link youtube không hợp lệ!', threadID, messageID);
					if (info.length_seconds > 360) return api.sendMessage("Độ dài video vượt quá mức cho phép, tối đa là 6 phút!", threadID, messageID);
					api.sendMessage("Đợi em một xíu em đang xử lý...", threadID, messageID);
					media.youtubeVideo(content, () => {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/video.mp4")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/video.mp4"));
					});
				});
			};
			return;
		}

		//get audio youtube
		if (contentMessage.indexOf(`${prefix}youtube -m`) == 0) {
			const media = require("./modules/media");
			var content = contentMessage.slice(prefix.length + 11, contentMessage.length);
			const ytdl = require("ytdl-core");
			if (!content) return api.sendMessage("Bạn chưa nhập thông tin cần thiết!", threadID, messageID);
			if (content.indexOf('https') == -1 || content.indexOf('http') == -1) {
				request(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=${googleSearch}&q=${encodeURIComponent(content)}`, (err, response, body) => {
					if (err) return api.sendMessage("Lỗi rồi :|", threadID, messageID);;
					var retrieve = JSON.parse(body);
					var content = "https://www.youtube.com/watch?v=" + retrieve.items[0].id.videoId;
					var title = retrieve.items[0].snippet.title;
					var thumbnails = retrieve.items[0].snippet.thumbnails.high.url;
					let callback = function() {
						api.sendMessage(
							title,
							threadID,
							() => {
								api.sendMessage({
									body: ``,
									attachment: fs.createReadStream(__dirname + "/src/thumbnails.png")
								}, threadID, () => {
									fs.unlinkSync(__dirname + "/src/thumbnails.png");
									api.sendMessage(content, threadID, () => getMusic(content));
								});
							},
							messageID
						);
					};
					request(thumbnails).pipe(fs.createWriteStream(__dirname + `/src/thumbnails.png`)).on("close", callback);
				});
			}
			else getMusic(content);
			function getMusic(content) {
				ytdl.getInfo(content, function(err, info) {
					if (err) return api.sendMessage('Link youtube không hợp lệ!', threadID, messageID);
					if (info.length_seconds > 360) return api.sendMessage("Độ dài video vượt quá mức cho phép, tối đa là 6 phút!", threadID, messageID);
					api.sendMessage("Đợi em một xíu em đang xử lý...", threadID, messageID);
					media.youtubeMusic(content, () => {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/music.mp3")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/music.mp3"));
					});
				});
			};
			return;
		}

		//anime
		if (contentMessage.indexOf(`${prefix}anime`) == 0) {
			var content = contentMessage.slice(prefix.length + 6, contentMessage.length);
			var jsonData = fs.readFileSync(__dirname + "/src/anime.json");
			var data = JSON.parse(jsonData).sfw;
			if (!content || !data.hasOwnProperty(content)) {
				let sfwList = [];
				Object.keys(data).forEach(endpoint => sfwList.push(endpoint));
				let sfwTags = sfwList.join(', ');
				return api.sendMessage(`=== Tất cả các tag Anime ===\n` + sfwTags, threadID, messageID);
			}
			return request(data[content], (error, response, body) => {
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let callback = function() {
					api.sendMessage({
						body: "",
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					}, threadID, () => fs.unlinkSync(__dirname + `/src/anime.${ext}`), messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});
		}

		//meme
		if (contentMessage == `${prefix}meme`)
			return request("https://meme-api.herokuapp.com/gimme/memes", (err, response, body) => {
				if (err) throw err;
				var content = JSON.parse(body);
				let title = content.title;
				var baseurl = content.url;
				let callback = function() {
					api.sendMessage({
						body: `${title}`,
						attachment: fs.createReadStream(__dirname + "/src/meme.jpg")
					}, threadID, () => fs.unlinkSync(__dirname + "/src/meme.jpg"), messageID);
				};
				request(baseurl).pipe(fs.createWriteStream(__dirname + `/src/meme.jpg`)).on("close", callback);
			});

		//gif
		if (contentMessage.indexOf(`${prefix}gif`) == 0) {
			var content = contentMessage.slice(prefix.length + 4, contentMessage.length);
			if (content.length == -1) return api.sendMessage(`Bạn đã nhập sai format, vui lòng ${prefix}help gif để biết thêm chi tiết!`, threadID, messageID);
			if (content.indexOf(`cat`) !== -1) {
				return request(`https://api.tenor.com/v1/random?key=${tenor}&q=cat&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					console.log(stringURL);
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + `/src/randompic.gif`)
						}, threadID, () => fs.unlinkSync(__dirname + `/src/randompic.gif`));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + `/src/randompic.gif`)).on("close", callback);
				});
			}
			else if (content.indexOf(`dog`) == 0) {
				return request(`https://api.tenor.com/v1/random?key=${tenor}&q=dog&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/randompic.gif"));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
			}
			else if (content.indexOf(`capoo`) == 0) {
				return request(`https://api.tenor.com/v1/random?key=${tenor}&q=capoo&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/randompic.gif"));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
			}
			else if (content.indexOf(`mixi`) == 0) {
				return request(`https://api.tenor.com/v1/random?key=${tenor}&q=mixigaming&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/randompic.gif"));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
			}
			else if (content.indexOf(`bomman`) == 0) {
				return request(`https://api.tenor.com/v1/random?key=${tenor}&q=bommanrage&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/randompic.gif"));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
			}
			else return api.sendMessage(`Tag của bạn nhập không tồn tại, vui lòng đọc hướng dẫn sử dụng trong ${prefix}help gif`, threadID, messageID);
		}

		//hug
		if (contentMessage.indexOf(`${prefix}hug`) == 0 && contentMessage.indexOf('@') !== -1)
			return request('https://nekos.life/api/v2/img/hug', (err, response, body) =>{
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let tag = contentMessage.slice(prefix.length + 5, contentMessage.length).replace("@", "");
				let callback = function() {
					api.sendMessage({
						body: tag + ", I wanna hug you ❤️",
						mentions: [
							{
								tag: tag,
								id: Object.keys(event.mentions)[0]
							}
						],
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					}, threadID, () => fs.unlinkSync(__dirname + `/src/anime.${ext}`), messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});

		//kiss
		if (contentMessage.indexOf(`${prefix}kiss`) == 0 && contentMessage.indexOf('@') !== -1)
			return request('https://nekos.life/api/v2/img/kiss', (err, response, body) =>{
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let tag = contentMessage.slice(prefix.length + 6, contentMessage.length).replace("@", "");
				let callback = function() {
					api.sendMessage({
						body: tag + ", I wanna kiss you ❤️",
						mentions: [
							{
								tag: tag,
								id: Object.keys(event.mentions)[0]
							}
						],
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					}, threadID, () => fs.unlinkSync(__dirname + `/src/anime.${ext}`), messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});

		//slap
		if (contentMessage.indexOf(`${prefix}slap`) == 0 && contentMessage.indexOf('@') !== -1)
			return request('https://nekos.life/api/v2/img/slap', (err, response, body) =>{
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let tag = contentMessage.slice(prefix.length + 5, contentMessage.length).replace("@", "");
				let callback = function() {
					api.sendMessage({
						body: tag + ", take this slap 😈",
						mentions: [
							{
								tag: tag,
								id: Object.keys(event.mentions)[0]
							}
						],
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					}, threadID, () => fs.unlinkSync(__dirname + `/src/anime.${ext}`), messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});

		//saucenao
		if (contentMessage.indexOf(`${prefix}saucenao`) == 0) {
			if (event.type != "message_reply") return api.sendMessage(`Vui lòng bạn reply bức ảnh cần phải tìm!`, threadID, messageID);
			if (event.messageReply.attachments.length > 1) return api.sendMessage(`Vui lòng reply chỉ một ảnh!`, threadID, messageID);
			if (event.messageReply.attachments[0].type == 'photo') {
				if (saucenao == '' || typeof saucenao == undefined) return api.sendMessage(`Chưa có api của saucenao!`, threadID, messageID);
				var imgURL = event.messageReply.attachments[0].url;
				const sagiri = require('sagiri'),
				search = new sagiri(saucenao, {
					numRes: 1
				});
				return search.getSauce(imgURL).then(response => {
					let data = response[0];
					let results = {
						thumbnail: data.original.header.thumbnail,
						similarity: data.similarity,
						material: data.original.data.material || 'none',
						characters: data.original.data.characters || 'none',
						creator: data.original.data.creator || 'none',
						site: data.site,
						url: data.url
					};
					const minSimilarity = 30;
					if (minSimilarity <= ~~results.similarity) {
						api.sendMessage(
							'Đây là kết quả tìm kiếm được\n' +
							'-------------------------\n' +
							'- Độ tương tự: ' + results.similarity + '%\n' +
							'- Material: ' + results.material + '\n' +
							'- Characters: ' + results.characters + '\n' +
							'- Creator: ' + results.creator + '\n' +
							'- Original site: ' + results.site + ' - ' + results.url,
							threadID, messageID
						);
					} else api.sendMessage(`Không thấy kết quả nào trùng với ảnh bạn đang tìm kiếm :'(`, threadID, messageID);
				});
			}
		}

		//Check if command is correct
		if (contentMessage.indexOf(prefix) == 0) {
			var findSpace = contentMessage.indexOf(' ');
			var checkCmd;
			if (findSpace == -1) {
				checkCmd = stringSimilarity.findBestMatch(contentMessage.slice(prefix.length, contentMessage.length), nocmdData.cmds);
				if (checkCmd.bestMatch.target == contentMessage.slice(prefix.length, contentMessage.length)) return;
			}
			else {
				checkCmd = stringSimilarity.findBestMatch(contentMessage.slice(prefix.length, findSpace), nocmdData.cmds);
				if (checkCmd.bestMatch.target == contentMessage.slice(prefix.length, findSpace)) return;
			}
			if (checkCmd.bestMatch.rating < 0.3) return;
			return api.sendMessage(`Lệnh bạn nhập không tồn tại.\nÝ bạn là lệnh "${prefix + checkCmd.bestMatch.target}" phải không?`, threadID, messageID);
		}
	}
}
/* This bot was made by Catalizcs(roxtigger2003) and SpermLord(spermlord) with love <3, pls dont delete this credits! THANKS */

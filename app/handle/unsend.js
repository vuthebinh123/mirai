module.exports = function({ api, __GLOBAL, User }) {
	return function ({ event }) {
		if (__GLOBAL.resendBlocked.includes(parseInt(event.threadID))) return;
		var getMsg = __GLOBAL.messages.find(item => item.msgID == event.messageID);
		User.getName(event.senderID).then(name => {
			let msg;
			if (getMsg.msgBody == '') msg = ' vừa gỡ một tệp đính kèm.';
			else msg = ' vừa gỡ một tin nhắn:\n' + getMsg.msgBody;
			if (event.senderID != api.getCurrentUserID())
				return api.sendMessage({
					body: name + msg,
					mentions: [
						{
							tag: name,
							id: event.senderID
						}
					]
				}, event.threadID);
		})
	}
}
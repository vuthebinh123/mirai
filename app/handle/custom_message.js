module.exports = function ({ api, config, __GLOBAL, User, Thread, Rank, Economy, Fishing, Nsfw, Image }) {
	function getText(...args) {
		const langText = __GLOBAL.language.event;
		const getKey = args[0];
		if (!langText.hasOwnProperty(getKey)) throw `${__filename} - Not found key language: ${getKey}`;
		let text = langText[getKey];
		for (let i = args.length; i > 0; i--) {
			let regEx = RegExp(`%${i}`, 'g');
			text = text.replace(regEx, args[i]);
		}
		return text;
	}

	return async function ({ event }) {
		//Do code here
	}
}
require("dotenv").config();
const path = require("path");
module.exports = {
	development: false,
	prefix: process.env.PREFIX,
	botName: process.env.BOT_NAME || "Project Mirai | Made by Catalizcs and SpermLord!",
	googleSearch: process.env.GOOGLE_SEARCH,
	wolfarm: process.env.WOLFARM,
	yandex: process.env.YANDEX,
	tenor: process.env.TENOR,
	openweather: process.env.OPENWEATHER,
	saucenao: process.env.SAUCENAO, 
	admins: (process.env.ADMINS || '').split('_').map(e => parseInt(e)), //Hãy edit trong file .env
	nsfwGodMode: false,
	database: {
		postgres: {
			database: 'postgres',
			username: 'postgres',
			password: 'root',
			host: 'localhost',
		},
		sqlite: {
			storage: path.resolve(__dirname, "./data.sqlite"),
		},
	},
	appStateFile: path.resolve(__dirname, '../appstate.json')
}
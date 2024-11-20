const SHEET_API_URL =
	"https://script.google.com/macros/s/AKfycbyhQPgGpXnrWyrmk2nMN5FL-_kMHjDcuGFLRhD5S5tDM5DqcUoW1ShKBMhxn9IiMT_8oA/exec";
const API_URL = "http://94.103.91.4:5000/";

async function getAuthToken() {
	const urlReg = `${API_URL}auth/registration`;
	const urlAuth = `${API_URL}auth/login`;
	const body = {
		username: "mans",
	};

	const options = {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "*/*" },
		muteHttpExceptions: true,
		validateHttpsCertificates: false,
		contentType: "application/json",
		body: JSON.stringify(body),
	};

	try {
		const responseAuth = await fetch(urlAuth, options);

		const jsonResponseAuth = await responseAuth.json();

		if (jsonResponseAuth?.message !== "Такого пользователя не существует") {
			return jsonResponseAuth.token;
		}

		const responseReg = await fetch(urlReg, options);

		const jsonResponseReg = await responseReg.json();

		if (jsonResponseReg?.statusCode && jsonResponseReg.statusCode === 400) {
			throw Error(jsonResponseReg.message);
		}

		return jsonResponseReg.token;
	} catch (err) {
		console.error(err);
	}
}

async function getClients(token) {
	const url = `${API_URL}clients?limit=1000&offset=1000`;

	const options = {
		method: "GET",
		headers: { "Content-Type": "application/json", Accept: "*/*", Authorization: `${token}` },
		muteHttpExceptions: true,
		contentType: "application/json",
		validateHttpsCertificates: false,
	};

	try {
		const response = await fetch(url, options);

		if (response.status !== 200) {
			throw Error(response.message);
		}

		const clients = await response.json();

		return clients;
	} catch (err) {
		console.error(err);
	}
}

async function getClientsStatuses(token, clientsId) {
	const url = `${API_URL}clients`;
	const body = {
		userIds: [...clientsId],
	};

	const options = {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "*/*", Authorization: `${token}` },
		muteHttpExceptions: true,
		contentType: "application/json",
		validateHttpsCertificates: false,
		body: JSON.stringify(body),
	};

	try {
		const response = await fetch(url, options);

		if (response.status >= 300) {
			throw Error(response.message);
		}

		const clientsStatuses = await response.json();

		return clientsStatuses;
	} catch (err) {
		console.error(err);
	}
}

async function sendDataToSheet(data) {
	const options = {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "*/*" },
		muteHttpExceptions: true,
		contentType: "application/json",
		validateHttpsCertificates: false,
		body: JSON.stringify(data),
	};

	try {
		const response = await fetch(SHEET_API_URL, options);

		if (response.status !== 200) {
			throw Error(response.message);
		}

		console.log(response);
		const message = await response.json();
		console.log(message);
	} catch (err) {
		console.error(err);
	}
}

(async () => {
	const token = await getAuthToken();

	if (!statuses) throw Error("Error token");

	const clients = await getClients(token);

	if (!clients) throw Error("Error clients");

	//Создаю коллекцию где id будет ключем
	let clientsCurrectData = {};
	clients.forEach((client) => {
		clientsCurrectData[client.id] = { ...client };
	});

	const statuses = await getClientsStatuses(
		token,
		Object.keys(clientsCurrectData).map((id) => +id)
	);

	if (!statuses) throw Error("Error statuses");

	//Отправляю данные в гугл таблицу
	const dataForSheet = statuses.map((status) => {
		return {
			...clientsCurrectData[status.id],
			status: status.status,
		};
	});

	sendDataToSheet(dataForSheet);
})();

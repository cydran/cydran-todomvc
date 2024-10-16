import { Dexie } from "../../node_modules/dexie/dist/dexie.mjs";

const DB_NAME = "todolist-dexie";
const TBL_TD = "todos";
const TBL_TS = "state";
const TDL_STATE = "visibility";

const SCHEMA = {
	[TBL_TD]: `id, title, completed, created`,
	[TBL_TS]: `id, ${TDL_STATE}`
}

const DEF_STATE = "all";

export const MSG = {
	CHAN: "DATA",
	ALL: "GetAll",
	GS: "GetState"
}

export class TodoRepo {
	constructor(logger, pubsub) {
		this.ps =  pubsub;
		this.logr = logger;
		this.db = new Dexie(DB_NAME, { autoOpen: false });
		this.db.version(1).stores(SCHEMA);
		this.db.open().catch (function (err) {
			this.logr.ifError(() => `Failed to open db: ${ err }`);
		});
	}

	add(todo) {
		this.db[TBL_TD].add(todo).then(async resp => {
			await this.logr.ifTrace(() => `add todo: id = ${ resp }`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	update(todo) {
		this.db[TBL_TD].put(todo).then(async resp => {
			await this.logr.ifTrace(() => `update todo: id = ${ resp }`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	remove(todo) {
		this.db[TBL_TD].delete(todo.id).then(async resp => {
			await this.logr.ifTrace(() => `delete todo: id = ${ todo.id }`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	getAll() {
		this.db[TBL_TD].toArray().then(async resp => {
			await this.ps.sendGlobally(MSG.CHAN, MSG.ALL, resp);
			this.logr.ifTrace(() => `get all todos`);
		}).catch(err => {
			this.ps.sendToContext(MSG.CHAN, MSG.ALL, []);
		});
	}

	storeVisibleState(state) {
		this.db[TBL_TS].put({"id": 1, "value": state}).then(resp => {
			this.logr.ifTrace(() => `add/update visibile state`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	getVisibleState() {
		this.db[TBL_TS].get(1).then(async resp => {
			await this.ps.sendGlobally(MSG.CHAN, MSG.GS, resp.value);
			this.logr.ifTrace(() => `get visible state`);
		}).catch(err => {
			this.ps.sendToContext(MSG.CHAN, MSG.GS, DEF_STATE);
		});
	}
}

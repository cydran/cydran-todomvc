import Dexie from "../../node_modules/dexie/dist/dexie.mjs";

const DB_NAME = "todolist";
const TBL_TD = "todos";
const TBL_TS = "state";
const TDL_STATE = "visibility";

const MsgType = {
	CHAN: "DATA",
	ALL: "GetAll",
	GS: "GetState"
}

const SCHEMA = {
	[TBL_TD]: `id, title, completed, created`,
	[TBL_TS]: `id, ${TDL_STATE}`
}

const DEF_STATE = "all";

class TodoRepo {
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
			await this.ps.sendGlobally(MsgType.CHAN, MsgType.ALL, resp);
			this.logr.ifTrace(() => `get all todos`);
		}).catch(err => {
			this.ps.sendToContext(MsgType.CHAN, MsgType.ALL, []);
		});
	}

	storeVisibleState(state) {
		this.db[TBL_TS].put({"id": 1, "value": state}).then(resp => {
			this.logr.ifTrace(() => `add visibile state`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	getVisibleState() {
		this.db[TBL_TS].get(1).then(async resp => {
			await this.ps.sendGlobally(MsgType.CHAN, MsgType.GS, resp.value);
			this.logr.ifTrace(() => `get visible state`);
		}).catch(err => {
			this.ps.sendToContext(MsgType.CHAN, MsgType.GS, DEF_STATE);
		});
	}
}

export { TodoRepo, MsgType };

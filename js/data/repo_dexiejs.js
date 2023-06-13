import Dexie from "../../node_modules/dexie/dist/dexie.mjs";

const DB_NAME = "todolist";
const TBL_TD = "todos";
const TBL_TS = "state";
const TDL_STATE = "visibility";

const SCHEMA = {
	[TBL_TD]: `id, title, completed, created`,
	[TBL_TS]: `id, ${TDL_STATE}`
}

const DEF_STATE = "all";

class TodoRepo {
	constructor(logger) {
		this.logr = logger;
		this.db = new Dexie(DB_NAME, { autoOpen: false });
		this.db.version(1).stores(SCHEMA);
		this.db.open().catch (function (err) {
			this.logr.ifError(() => `Failed to open db: ${err}`);
		});
	}

	add(todo) {
		this.db[TBL_TD].add(todo).then(resp => {
			this.logr.ifTrace(() => `add todo: id = ${ todo.id }`);
			return resp;
		}).catch(err => {
			this.logr.ifError(() => err);
			throw err;
		});
	}

	update(todo) {
		this.db[TBL_TD].put(todo).then(resp => { 
			this.logr.ifTrace(() => `update todo: id = ${ todo.id }`);
			return resp;
		}).catch(err => {
			this.logr.ifError(() => err);
			throw err;
		});
	}

	remove(todo) {
		this.db[TBL_TD].delete(todo.id).then(resp => {
			this.logr.ifTrace(() => `delete todo: id = ${ todo.id }`);
		}).catch(err => {
			this.logr.ifError(() => err);
			throw err;
		});
	}

	getAll() {
		return this.db[TBL_TD].toArray().catch(err => {
			this.logr.ifError(() => err);
			return [];
		});
	}

	storeVisibleState(state) {
		this.db[TBL_TS].add(state, 1).then(resp => {
			this.logr.ifTrace(() => `add visibile state`);
			return resp;
		}).catch(err => {
			this.logr.ifError(() => err);
			throw err;
		});
	}

	getVisibleState() {
		return this.db[TBL_TS].get(1).then(resp => {
			this.logr.ifTrace(() => `get visible state`);
			return resp;
		}).catch(err => {
			this.logr.ifError(() => err);
			return DEF_STATE;
		});
	}
}

export default TodoRepo;

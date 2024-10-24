import { Dexie } from "./dexie.mjs";
import { DB_NAME, Table, MSG } from "/js/data/constants.js";
import { SCHEMA } from "/js/data/dexie-setup.js";

const DEF_STATE = "all";

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
		this.db[Table.TODO].add(todo).then(async resp => {
			await this.logr.ifTrace(() => `add todo: id = ${ resp }`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	update(todo) {
		this.db[Table.TODO].put(todo).then(async resp => {
			await this.logr.ifTrace(() => `update todo: id = ${ resp }`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	remove(todo) {
		this.db[Table.TODO].delete(todo.id).then(async resp => {
			await this.logr.ifTrace(() => `delete todo: id = ${ todo.id }`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	getAll() {
		this.db[Table.TODO].toArray().then(async resp => {
			await this.ps.sendGlobally(MSG.CHAN, MSG.ALL, resp);
			this.logr.ifTrace(() => `get all todos`);
		}).catch(err => {
			this.ps.sendToContext(MSG.CHAN, MSG.ALL, []);
		});
	}

	storeVisibleState(state) {
		this.db[Table.STATE].put({"id": 1, "value": state}).then(resp => {
			this.logr.ifTrace(() => `add/update visibile state`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	getVisibleState() {
		this.db[Table.STATE].get(1).then(async resp => {
			await this.ps.sendGlobally(MSG.CHAN, MSG.GS, resp.value);
			this.logr.ifTrace(() => `get visible state`);
		}).catch(err => {
			this.ps.sendToContext(MSG.CHAN, MSG.GS, DEF_STATE);
		});
	}
}

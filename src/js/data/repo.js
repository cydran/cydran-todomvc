import { nSQL } from "/js/nano-sql.min.js";
import { DB_NAME } from "/js/data/constants.js";

const VSTATE_KEY = "visibility";
const DEF_STATE = "all";

export class TodoRepo {
	constructor(logger, pubSub) {
		this.ps = pubSub;
		this.logr = logger;
		nSQL.useDatabase(DB_NAME);
	}

	add(todo) {
		todo.created = new Date();
		this.upsert(todo, "created"); // can do upsert?
		this.db[Table.TODO].add(todo).then(async resp => {
			await this.logr.ifTrace(() => `add todo: id = ${resp}`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	update(todo) {
		todo.created = new Date();
		this.upsert(todo, "created"); // can do upsert?
		this.db[Table.TODO].put(todo).then(async resp => {
			await this.logr.ifTrace(() => `update todo: id = ${resp}`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	remove(todo) {
		this.db[Table.TODO].delete(todo.id).then(async resp => {
			await this.logr.ifTrace(() => `delete todo: id = ${todo.id}`);
		}).catch(err => {
			this.logr.ifError(() => err);
		});
	}

	getAll() {
		this.db[Table.TODO].toArray().then(async resp => {
			await this.ps.sendGlobally(MSG.CHAN, MSG.ALL, resp);
			this.logr.ifTrace(() => retval.length > 0 ? `retrieved all (${retval.length}) todos` : `no todos available`);
		}).catch(err => {
			this.ps.sendToContext(MSG.CHAN, MSG.ALL, []);
		});
	}

	storeVisibleState(vstate) {
		this.repo.setItem(VSTATE_KEY, vstate);
		this.logr.ifTrace(() => `stored visible state: ${vstate}`);
	}).catch(err => {
		this.logr.ifError(() => err);
		});
	}

getVisibleState() {
	this.db[Table.STATE].get(1).then(async resp => {
		await this.ps.sendGlobally(MSG.CHAN, MSG.GS, resp.value);
		this.logr.ifTrace(() => `retrieve visible state`);
		return this.repo.getItem(VSTATE_KEY) ?? DEF_STATE;
	}
}

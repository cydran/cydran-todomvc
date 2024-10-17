const VSTATE_KEY = "visibility";
const DEF_STATE = "all";

export class TodoRepo {
	constructor(logger) {
		this.repo = window.localStorage;
		this.logr = logger;
	}

	add(todo) {
		todo.created = new Date();
		this.upsert(todo, "created");
	}

	update(todo) {
		todo.updated = new Date();
		this.upsert(todo, "updated");
	}

	upsert(todo, act) {
		this.repo.setItem(todo.id, JSON.stringify(todo));
		this.logr.ifTrace(() => `${ act } todo - id: ${ todo.id }`);
	}

	remove(todo) {
		this.repo.removeItem(todo.id);
		this.logr.ifTrace(() => `removed todo - id: ${ todo.id }`);
	}

	getAll() {
		const retval = [];
		Object.keys(this.repo).filter((k) => k != VSTATE_KEY)
			.forEach(k => {
				retval.push(JSON.parse(this.repo.getItem(k)));
			});
		this.logr.ifTrace(() => retval.length > 0 ? `retrieved all (${ retval.length }) todos` : `no todos available`);
		return retval;
	}

	storeVisibleState(vstate) {
		this.repo.setItem(VSTATE_KEY, vstate);
		this.logr.ifTrace(() => `stored visible state: ${ vstate }`);
	}

	getVisibleState() {
		this.logr.ifTrace(() => `retrieve visible state`);
		return this.repo.getItem(VSTATE_KEY) ?? DEF_STATE;
	}
}

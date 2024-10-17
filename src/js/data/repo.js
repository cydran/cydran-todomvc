const vStateKey = "visibility";
const defaultState = "all";

export class TodoRepo {
	constructor(logger) {
		this.repo = window.localStorage;
		this.logr = logger;
	}

	add(todo) {
		todo.created = new Date();
		this.repo.setItem(todo.id, JSON.stringify(todo));
		this.logr.ifTrace(() => `created todo - id: ${ todo.id }`);
	}

	update(todo) {
		todo.updated = new Date();
		this.repo.setItem(todo.id, JSON.stringify(todo));
		this.logr.ifTrace(() => `updated todo - id: ${ todo.id }`);
	}

	remove(todo) {
		this.repo.removeItem(todo.id);
		this.logr.ifTrace(() => `removed todo - id: ${ todo.id }`);
	}

	getAll() {
		const retval = [];
		Object.keys(this.repo).filter((k) => k != vStateKey)
			.forEach(k => {
				retval.push(JSON.parse(this.repo.getItem(k)));
			});
		this.logr.ifTrace(() => `retrieved all todos`);
		return retval;
	}

	storeVisibleState(state) {
		this.repo.setItem(vStateKey, state);
		this.logr.ifTrace(() => `stored visible state: ${ state }`);
	}

	getVisibleState() {
		this.logr.ifTrace(() => `retrieve visible state`);
		return this.repo.getItem(vStateKey) || defaultState;
	}
}

const vStateKey = "visibility";
const defaultState = "all";

export class TodoRepo {
	constructor(logger) {
		this.repo = window.localStorage;
		this.logr = logger;
	}

	add(todo) {
		this.logr.ifTrace(() => `add todo: id = ${ todo.id }`);
		todo.created = new Date();
		this.repo.setItem(todo.id, JSON.stringify(todo));
	}

	update(todo) {
		this.logr.ifTrace(() => `update todo: id = ${ todo.id }`);
		todo.updated = new Date();
		this.repo.setItem(todo.id, JSON.stringify(todo));
	}

	remove(todo) {
		this.logr.ifTrace(() => `remove todo: id = ${ todo.id }`);
		this.repo.removeItem(todo.id);
	}

	getAll() {
		this.logr.ifTrace(() => `get all todos`);
		const retval = [];
		Object.keys(this.repo).filter((k) => k != vStateKey)
			.forEach(k => {
				retval.push(JSON.parse(this.repo.getItem(k)));
			});
		return retval;
	}

	storeVisibleState(state) {
		this.logr.ifTrace(() => `store visible state: ${ state }`);
		this.repo.setItem(vStateKey, state);
	}

	getVisibleState() {
		this.logr.ifTrace(() => `get visible state`);
		return this.repo.getItem(vStateKey) || defaultState;
	}
}

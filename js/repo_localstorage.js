const listName = "todolist";
const visibilityState = "visibility";
const defaultState = "all";

class TodoRepo {
	constructor(logger) {
		this.repo = window.localStorage;
		this.logr = logger;
	}

	add(todo) {
		this.logr.ifTrace(() => `add todo: id = ${ todo.id }`);
		this.repo.setItem(todo.id, JSON.stringify(todo));
	}

	update(todo) {
		this.logr.ifTrace(() => `update todo: id = ${ todo.id }`);
		this.repo.setItem(todo.id, JSON.stringify(todo));
	}

	remove(todo) {
		this.logr.ifTrace(() => `remove todo: id = ${ todo.id }`);
		this.repo.removeItem(todo.id);
	}

	getAll() {
		this.logr.ifTrace(() => `get all todos`);
		const retval = [];
		Object.keys(this.repo).forEach(k => {
			if(k !== visibilityState) {
				retval.push(JSON.parse(this.repo.getItem(k)));
			}
		});
		return retval;
	}

	storeVisibleState(state) {
		this.logr.ifTrace(() => `store visible state: ${ state }`);
		this.repo.setItem(visibilityState, state);
	}

	getVisibleState() {
		this.logr.ifTrace(() => `get visible state`);
		return this.repo.getItem(visibilityState) || defaultState;
	}
}

export default TodoRepo;

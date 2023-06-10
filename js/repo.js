const listName = "todolist";
const visibilityState = "visibility";

class TodoRepo {
	constructor(logger) {
		this.logr = logger;
	}

	storeAll(todos) {
		this.logr.ifTrace(() => `store all: ${ JSON.stringify(todos) }`);
		window.localStorage.setItem(listName, JSON.stringify(todos));
	}
	getAll() {
		this.logr.ifTrace(() => `get all todos`);
		return JSON.parse(window.localStorage.getItem(listName)) || [];
	}
	storeVisibleState(state) {
		this.logr.ifTrace(() => `store visible state: ${ state }`);
		window.localStorage.setItem(visibilityState, state);
	}
	getVisibleState() {
		this.logr.ifTrace(() => `get visible state`);
		return window.localStorage.getItem(visibilityState) || "all";
	}
}

export default TodoRepo;

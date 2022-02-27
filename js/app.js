const args = cydran.argumentsBuilder;
const builder = cydran.builder;
const Component = cydran.Component;
const Filters = cydran.Filters;

const PERSONALIZED = "todo.person";
const PROPERTIES = {
	"cydran.production.enabled": false,
	"cydran.production.startphrase": "Let it ride! Baby needs new shoes!",
	"cydran.development.startphrase": "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. (Martin Fowler)",
	"cydran.logging.color.debug": "#00f900",
	"cydran.logging.level": "info",
	"cydran.logging.label": "ctdmvc",
	"cydran.logging.label.visible": false,
	[PERSONALIZED]: ""
};

const KEY_ENTER = 13;
const KEY_ESC = 27;
const todoList = "todolist";
const visibilityState = "visibility";
const TODO_CHANNEL = "TODOS";
const RMV_TODO = "removeTodo";
const template = (id) => document.querySelector(`template[id=${ id }]`).innerHTML.trim();

class TodoListItem {
	constructor() {
		this.title = null;
		this.completed = false;
	}
}

class TodoRepo {
	constructor(logger) {
		this.logr = logger;
	}

	storeAll(todos) {
		this.logr.ifTrace(() => `store all: ${ todos }`);
		window.localStorage.setItem(todoList, JSON.stringify(todos));
	}
	getAll() {
		this.logr.ifTrace(() => `get all todos`);
		return JSON.parse(window.localStorage.getItem(todoList)) || [];
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

class App extends Component {
	constructor(who, newIds) {
		super(template(App.name.toLowerCase()));

		this.who = who || "";
		this.newIds = newIds;

		this.repo = this.get(TodoRepo.name);
		this.todos = this.repo.getAll();
		this.filterVisiblity = this.repo.getVisibleState();
		this.filtered = Filters.builder(this, "m().todos")
			.withPredicate("p(0) === 'all' || !v().completed && p(0) === 'active' || v().completed && p(0) === 'completed'", "m().filterVisiblity")
			.build();
		this.remaining = 0;
		this.togAllDoneOrNot = false;
		this.newTodoValue = "";

		this.watch("m().todos", () => {
			this.computeRemaining();
			this.repo.storeAll(this.todos);
		});

		this.watch("m().filterVisiblity", () => this.repo.storeVisibleState(this.filterVisiblity));
		this.on(RMV_TODO).forChannel(TODO_CHANNEL).invoke(this.removeTodo);
		this.computeRemaining();
	}

	onMount() {
		this.getLogger().ifDebug(() => `onMount newIds: ${ JSON.stringify(this.newIds) }`);
	}

	computeRemaining() {
		this.remaining = this.todos.filter(t => !t.completed).length;
	}

	addTodo(event) {
		if (event.keyCode == KEY_ENTER) {
			const newTodo = new TodoListItem();
			newTodo.title = this.newTodoValue;
			event.target.value = "";
			this.todos.push(newTodo);
			this.getLogger().ifDebug(() => `Created: ${ JSON.stringify(newTodo) }`);
		}
	}

	removeTodo(todo) {
		const removeIdx = this.todos.findIndex(e => e.id === todo.id);
		if (removeIdx > -1) {
			this.todos.splice(removeIdx, 1);
			this.getLogger().ifDebug(() => `Removed: ${ JSON.stringify(todo) }`);
		}
	}

	removeCompletedItems() {
		this.todos = this.todos.filter(item => !item.completed);
		this.getLogger().ifDebug(() => `Removed completed items`);
	}

	toggleAll() {
		this.todos.forEach(todo => todo.completed = !this.togAllDoneOrNot);
		this.togAllDoneOrNot = !this.togAllDoneOrNot;
		this.getLogger().ifDebug(() => `all items marked done: ${this.togAllDoneOrNot}`);
	}
}

class TodoItem extends Component {
	constructor() {
		super(template(TodoItem.name.toLowerCase()));
		this.inEditMode = false;
		this.origEditText = "";
	}

	kill() {
		this.broadcast(TODO_CHANNEL, RMV_TODO, this.getValue());
	}

	edit() {
		this.inEditMode = true;
		this.origEditText = this.getValue().title;
	}

	cancelEdit() {
		this.getValue().title = this.origEditText;
		this.doneEdit();
	}

	doneEdit() {
		this.origEditText = "";
		this.inEditMode = false;
	}

	finishEdit(event) {
		switch (event.keyCode) {
			case KEY_ENTER:
				event.target.blur();
				this.getLogger().ifDebug(() => `New todo text: ${ this.getValue().title }`);
				break;
			case KEY_ESC:
				this.cancelEdit();
				break;
		}
	}

	isComplete() {
		this.getValue().completed = !this.getValue().completed;
	}
}

builder("body>div#appbody", PROPERTIES)
	.withScopeItem("pluralize", (str, cnt) => (cnt !== 1 ? `${ str }s` : str))
	.withSingleton(TodoRepo.name, TodoRepo, args().withLogger("Repo", "trace").build())
	.withPrototype(App.name, App, args().withProperty(PERSONALIZED).withInstanceId(11).build())
	.withPrototype(TodoItem.name, TodoItem)
	.withInitializer(stage => {
		stage.setComponentFromRegistry(App.name);
	})
	.build()
	.start();

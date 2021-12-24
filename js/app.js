const args = cydran.argumentsBuilder;
const builder = cydran.builder;
const Component = cydran.Component;
const Filters = cydran.Filters;

const PROPERTIES = {
	"cydran.production.enabled": false,
	"cydran.production.startphrase": "Let it ride! Baby needs new shoes!",
	"cydran.development.startphrase": "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. (Martin Fowler)",
	"cydran.logging.color.debug": "#00f900",
	"cydran.logging.level": "debug",
	"todo.person": ""
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
	storeAll(todos) {
		window.localStorage.setItem(todoList, JSON.stringify(todos));
	}
	getAll() {
		return JSON.parse(window.localStorage.getItem(todoList)) || [];
	}
	storeVisibleState(state) {
		window.localStorage.setItem(visibilityState, state);
	}
	getVisibleState() {
		return window.localStorage.getItem(visibilityState) || "all";
	}
}

class App extends Component {
	constructor(who) {
		super(template(App.name.toLowerCase()));

		this.who = who || "";

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
		const keyFam = "cydran.";
		const keyGrp = this.getProperties().keyFamilyPropertyNames(keyFam);
		this.getLogger().ifDebug(() => `onMount "${ keyFam }" key group: ${ JSON.stringify(keyGrp, null, 3) }`);
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
			this.getLogger().ifDebug(() => `Created todo item: ${ JSON.stringify(newTodo) }`);
		}
	}

	removeTodo(todo) {
		const removeIdx = this.todos.indexOf(todo);
		if (removeIdx > -1) {
			this.todos.splice(removeIdx, 1);
			this.getLogger().ifDebug(() => `Removed todo item: ${ JSON.stringify(todo) }`);
		}
	}

	removeCompletedItems() {
		this.todos = this.todos.filter(item => !item.completed);
		this.getLogger().ifDebug(() => `Removed completed items`);
	}

	toggleAll() {
		this.todos.forEach(todo => todo.completed = !this.togAllDoneOrNot);
		this.togAllDoneOrNot = !this.togAllDoneOrNot;
		this.getLogger().ifDebug(() => `Toggled all items`);
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
				this.getLogger().ifDebug(() => `New text of todo: ${ this.getValue().title }`);
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
	.withSingleton(TodoRepo.name, TodoRepo)
	.withPrototype(App.name, App, args().withProperty("todo.person").build())
	.withPrototype(TodoItem.name, TodoItem)
	.withInitializer(stage => {
		stage.setComponentFromRegistry(App.name);
	})
	.build()
	.start();

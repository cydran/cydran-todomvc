const args = cydran.argumentsBuilder;
const builder = cydran.builder;
const Component = cydran.Component;
const Filters = cydran.Filters;

const PROPERTIES = {
	"cydran.production.enabled": false,
	"cydran.production.startphrase": "Let it ride! Baby needs new shoes!",
	"cydran.development.startphrase": "Deleted code is debugged code. (Jeff Sickel)",
	"cydran.logging.color.info": "#d4fb78",
	"todo.person": ""
};

const KEY_ENTER = 13;
const KEY_ESC = 27;
const todoList = "todolist";
const visibilityState = "visibility";
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
		this.on("removeTodo").forChannel("TODOS").invoke(this.removeTodo);
	}

	onMount() {
		this.computeRemaining();
		this.getLogger().ifDebug(() => `Cydran keys: ${ JSON.stringify(this.getProperties().keyFamilyPrepertyNames('cydran.',), null, 2) }`);
	}

	computeRemaining() {
		this.remaining = this.todos.filter(t => !t.completed).length;
	}

	addTodo(event) {
		if (event.keyCode == KEY_ENTER) {
			let newTodo = new TodoListItem();
			newTodo.title = this.newTodoValue;
			event.target.value = "";
			this.todos.push(newTodo);
			this.getLogger().ifDebug(() => `Adding todo item: ${ JSON.stringify(newTodo) }`);
		}
	}

	removeTodo(todo) {
		const removeIdx = this.todos.indexOf(todo);
		if (removeIdx > -1) {
			this.todos.splice(removeIdx, 1);
			this.getLogger().ifDebug(() => `Dumping todo item: ${ JSON.stringify(todo) }`);
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
		this.broadcast("TODOS", "removeTodo", this.getValue());
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

	stateLog(action) {
		this.getLogger().ifDebug(() => `${ this.constructor.name } - [${ this.getId() }] - ${ action }`);
	}
}

builder("body>div#appbody")
	.withProperties(PROPERTIES)
	.withScopeItem("pluralize", (str, cnt) => (cnt !== 1 ? `${ str }s` : str))
	.withSingleton(TodoRepo.name, TodoRepo)
	.withPrototype(App.name, App, args().withProperty("todo.person").build())
	.withPrototype(TodoItem.name, TodoItem)
	.withInitializer(stage => {
		stage.setComponentFromRegistry(App.name);
	})
	.build()
	.start();

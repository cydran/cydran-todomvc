const builder = cydran.builder;
const Component = cydran.Component;
const Filters = cydran.Filters;

const KEY_ENTER = 13;
const KEY_ESC = 27;
const todoList = "todolist";
const visibilityState = "visibility";
const template = (id) => document.querySelector("template[id=" + id + "]").innerHTML.trim();

class TodoItem {

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
	constructor() {
		super(template("app"));
		this.repo = new TodoRepo();
		this.todos = this.repo.getAll();
		this.filterVisiblity = this.repo.getVisibleState();
		this.filtered = Filters.builder(this, "m().todos")
			.withPredicate("(p(0) === 'all') || (!v().completed && p(0) === 'active') || (v().completed && p(0) === 'completed')", "m().filterVisiblity")
			.build();
		this.remaining = 0;
		this.togAllDoneOrNot = false;
		this.newTodoValue = "";

		this.watch("m().todos", () => {
			this.remaining = this.todos.filter(t => !t.completed).length;
			this.repo.storeAll(this.todos);
		});

		this.watch("m().filterVisiblity", () => this.repo.storeVisibleState(this.filterVisiblity));
	}

	addTodo(event) {
		if (event.keyCode == KEY_ENTER) {
			let newTodo = new TodoItem();
			newTodo.title = this.newTodoValue;
			event.target.value = "";
			this.todos.push(newTodo);
		}
	}

	removeTodo(todo) {
		const removeIdx = this.todos.indexOf(todo);

		if (removeIdx > -1) {
			this.todos.splice(removeIdx, 1);
		}
	}

	removeCompletedItems() {
		this.todos = this.todos.filter(item => !item.completed);
	}

	toggleAll() {
		this.todos.forEach(todo => todo.completed = !this.togAllDoneOrNot);
		this.togAllDoneOrNot = !this.togAllDoneOrNot;
	}
}

class Todo extends Component {

	constructor() {
		super(template("todoitem"));
		this.inEditMode = false;
		this.origEditText = "";
	}

	kill() {
		this.getParent().removeTodo(this.getValue());
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

builder("body>div#appbody")
	.withInfoLogging()
	.withScopeItem("pluralize", (str, cnt) => (cnt != 1 ? str + "s" : str))
	.withPrototype(App.name, App)
	.withPrototype(Todo.name, Todo)
	.withInitializer(stage => stage.setComponentFromRegistry(App.name))
	.build()
	.start();

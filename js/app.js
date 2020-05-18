window.onload = () => {
	const builder = cydran.builder;
	const Component = cydran.Component;
	const filterBuilder = cydran.filterBuilder;
	const KEY_ENTER = 13;
	const KEY_ESC = 27;
	const todoList = "todolist";
	const visibilityState = "visibility";
	const APP_TEMPLATE = document.querySelector("template[id=app]").innerHTML.trim();
	const TODO_TEMPLATE = document.querySelector("template[id=todoitem]").innerHTML.trim();

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
			super(APP_TEMPLATE);
			this.repo = new TodoRepo();
			this.todos = this.repo.getAll();
			this.filterVisiblity = this.repo.getVisibleState();
			this.filtered = filterBuilder(this, "m().todos")
				.withPredicate("(p(0) === 'all') || (!v().completed && p(0) === 'active') || (v().completed && p(0) === 'completed')", "m().filterVisiblity")
				.build();
			this.remaining = 0;
			this.togAllDoneOrNot = false;
			this.newTodoValue = "";
			this.completedCount = 0;

			this.watch("m().todos", () => {
				this.remaining = this.todos.filter(t => !t.completed).length;
				this.completedCount = this.todos.length - this.remaining;
				this.repo.storeAll(this.todos);
			});

			this.watch("m().filterVisiblity", () => {
				this.repo.storeVisibleState(this.filterVisiblity);
			});
		}

		setFilter(filter) {
			this.filterVisiblity = filter;
			this.getLogger().ifDebug(() => "filter set to " + this.filterVisiblity);
		}

		addTodo(event) {
			if (event.keyCode == KEY_ENTER) {
				let newTodo = new TodoItem();
				newTodo.title = this.newTodoValue;
				event.target.value = "";
				this.todos.push(newTodo);
				this.getLogger().ifDebug(() => "new todo added: " + JSON.stringify(newTodo));
			}
		}

		removeTodo(todo) {
			const removeIdx = this.todos.indexOf(todo);

			if (removeIdx > -1) {
				this.todos.splice(removeIdx, 1);
				this.getLogger().ifDebug(() => "todo item removed: " + JSON.stringify(todo));
			}
		}

		removeCompletedItems() {
			if (this.todos) {
				const remaining = this.todos.filter(item => !item.completed);
				this.todos = remaining;
			}
		}

		completedCount() {
			let retval = 0;

			for (const t in this.todos) {
				if (t.completed) {
					++retval;
				}
			}

			return retval;
		}

		toggleAll() {
			this.todos.forEach(todo => {
				todo.completed = !this.togAllDoneOrNot;
			});

			this.togAllDoneOrNot = !this.togAllDoneOrNot;
		}
	}

	class Todo extends Component {

		constructor() {
			super(TODO_TEMPLATE);
			this.inEditMode = false;
			this.origEditText = "";
		}

		kill() {
			this.getParent().removeTodo(this.getValue());
		}

		edit() {
			this.inEditMode = true;
			this.origEditText = this.getValue().title;
			this.getLogger().ifDebug(() => "begin edit of todo: " + JSON.stringify(this.getValue()));
		}

		cancelEdit() {
			this.getValue().title = this.origEditText;
			this.origEditText = "";
			this.inEditMode = false;
			this.getLogger().ifDebug(() => "cancel edit of todo: " + JSON.stringify(this.getValue()));
		}

		doneEdit() {
			this.origEditText = "";
			this.inEditMode = false;
			this.getLogger().ifDebug(() => "finish edit of todo: " + JSON.stringify(this.getValue()));
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
		.withDebugLogging()
		.withScopeItem("pluralize", (str, cnt) => (cnt != 1 ? str + "s" : str))
		.withPrototype(App.name, App)
		.withPrototype(Todo.name, Todo)
		.withInitializer(stage => {
			stage.setComponentFromRegistry(App.name);
		})
		.build()
		.start();
};

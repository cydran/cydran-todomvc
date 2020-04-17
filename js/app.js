window.onload = function() {
  const builder = cydran.builder;
  const Component = cydran.Component;
  const Stage = cydran.stage;
  const StageBuilder = cydran.StageBuilder;

  const KEY_ENTER = 13;
  const KEY_ESC = 27;
  const APP_TEMPLATE = document
    .querySelector('template[id=app]')
    .innerHTML.trim();
  const TODO_TEMPLATE = document
    .querySelector('template[id=todoitem]')
    .innerHTML.trim();

  class TodoItem {
    constructor() {
      this.id = null;
      this.title = null;
      this.completed = false;
    }
  }

  class App extends Component {
    constructor() {
      super(APP_TEMPLATE);
      this.log = this.getLogger();
      this.watch('m().todos', () => {
        this.remaining = this.todos.filter(t => !t.completed).length;
				this.completedCount = this.todos.length - this.remaining;
      });
      this.watch('m().allDone', this.toggleAllComplete);
			this.on("killitem").forChannel(App.name).invoke(this.removeTodo);
    }

    init() {
      this.todos = [];
      this.remaining = 0;
      this.filterVisiblity = 'all';
      this.allDone = false;
      this.newTodoValue = '';
			this.completedCount = 0;
    }

    setFilter(filter) {
      this.filterVisiblity = filter;
      this.log.ifDebug(() => 'filter set to ' + this.filterVisiblity);
    }

    filteredTodos() {
      let retval = [];
      switch (this.filterVisiblity) {
        case 'active':
          retval = this.todos.filter(t => t.completed == false);
          break;
        case 'completed':
          retval = this.todos.filter(t => t.completed);
          break;
        default:
          retval = this.todos;
          break;
      }
      return retval;
    }

    addTodo(event) {
      if (event.keyCode == KEY_ENTER) {
        const newTodo = new TodoItem();
        newTodo.title = this.newTodoValue;
        this.todos.push(newTodo);
        this.log.ifDebug(() => 'new todo added: ' + JSON.stringify(newTodo));
        event.target.value = '';
      }
    }

    removeTodo(todo) {
      const removeIdx = this.todos.indexOf(todo);
      this.todos.splice(removeIdx, 1);
			this.log.ifDebug(() => 'todo item removed: ' + JSON.stringify(todo));
    }

    removeCompleted() {
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

    toggleAllComplete() {
      this.todos.forEach(todo => {
        todo.completed = this.allDone;
      });
			console.log(this.todos);
    }
  }

  class Todo extends Component {
    constructor() {
      super(TODO_TEMPLATE);
			this.log = this.getLogger();
    }

    init() {
      this.inEditMode = false;
      this.origEditText = '';
    }

		kill() {
			this.broadcast(App.name, "killitem", this.getItem());
		}

    edit() {
      this.inEditMode = true;
      this.origEditText = this.getItem().title;
      this.log.ifDebug(
        () => 'begin edit of todo' + JSON.stringify(this.getItem())
      );
    }

    cancelEdit() {
      this.getItem().title = this.origEditText;
      this.origEditText = '';
      this.inEditMode = false;
      this.log.ifDebug(
        () => 'cancel edit of todo' + JSON.stringify(this.getItem())
      );
    }

    doneEdit() {
      this.origEditText = '';
      this.inEditMode = false;
      this.log.ifDebug(() => 'finish edit of todo');
    }

    finishEdit(event) {
      switch (event.keyCode) {
        case KEY_ENTER:
          this.doneEdit();
          break;
        case KEY_ESC:
          this.cancelEdit();
          break;
      }
    }

    toggleComplete() {
      this.getItem().completed = !this.getItem().completed;
    }
  }

  builder('body>div#appbody')
    .withDebugLogging()
    .withScopeItem('pluralize', (str, cnt) => (cnt != 1 ? str + 's' : str))
    .withPrototype(App.name, App)
    .withPrototype(Todo.name, Todo)
    .withInitializer(stage => {
      stage.setComponentFromRegistry(App.name);
    })
    .build()
    .start();
};

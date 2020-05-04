window.onload = function() {
  console.time();
  const builder = cydran.builder;
  const Component = cydran.Component;
  const Stage = cydran.stage;
  const StageBuilder = cydran.StageBuilder;

  const KEY_ENTER = 13;
  const KEY_ESC = 27;
  const APP_TEMPLATE = document
    .querySelector("template[id=app]")
    .innerHTML.trim();
  const TODO_TEMPLATE = document
    .querySelector("template[id=todoitem]")
    .innerHTML.trim();

  class TodoItem {
    constructor() {
      this.title = null;
      this.completed = false;
    }
  }

  class App extends Component {
    constructor() {
      super(APP_TEMPLATE);

      this.todos = [];
      this.filtered = [];
      this.remaining = 0;
      this.filterVisiblity = "all";
      this.togAllDoneOrNot = false;
      this.newTodoValue = "";
      this.completedCount = 0;

      this.watch("m().todos", () => {
        this.remaining = this.todos.filter(t => !t.completed).length;
        this.completedCount = this.todos.length - this.remaining;
        this.filteredTodos();
      });
      this.watch("m().filterVisiblity", this.filteredTodos);
    }

    setFilter(filter) {
      this.filterVisiblity = filter;
      this.getLogger().ifDebug(() => "filter set to " + this.filterVisiblity);
    }

    filteredTodos() {
      this.getLogger().ifDebug(() => "change in todos > setting filtered list");
      switch (this.filterVisiblity) {
        case "active":
          this.filtered = this.todos.filter(t => t.completed == false);
          break;
        case "completed":
          this.filtered = this.todos.filter(t => t.completed);
          break;
        default:
          this.filtered = this.todos;
          break;
      }
    }

    addTodo(event) {
      if (event.keyCode == KEY_ENTER) {
        let newTodo = new TodoItem();
        newTodo.title = this.newTodoValue;
        event.target.value = "";
        this.todos.push(newTodo);
        this.getLogger().ifDebug(
          () => "new todo added: " + JSON.stringify(newTodo)
        );
      }
    }

    removeTodo(todo) {
      const removeIdx = this.todos.indexOf(todo);
      if (removeIdx > -1) {
        this.todos.splice(removeIdx, 1);
        this.getLogger().ifDebug(
          () => "todo item removed: " + JSON.stringify(todo)
        );
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
      console.log(this.todos);
    }
  }

  class Todo extends Component {
    constructor() {
      super(TODO_TEMPLATE);
      this.inEditMode = false;
      this.origEditText = "";
    }

    kill() {
      this.getParent().removeTodo(this.getItem());
    }

    edit() {
      this.inEditMode = true;
      this.origEditText = this.getItem().title;
      // timeout for browser behavior to flow the DOM
      setTimeout(() => {
        this.getEl().querySelector("input[class=edit]").focus();
      }, 1);
      this.getLogger().ifDebug(
        () => "begin edit of todo: " + JSON.stringify(this.getItem())
      );
    }

    cancelEdit() {
      this.getItem().title = this.origEditText;
      this.origEditText = "";
      this.inEditMode = false;
      this.getLogger().ifDebug(
        () => "cancel edit of todo: " + JSON.stringify(this.getItem())
      );
    }

    doneEdit() {
      this.origEditText = "";
      this.inEditMode = false;
      this.getLogger().ifDebug(
        () => "finish edit of todo: " + JSON.stringify(this.getItem())
      );
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
      this.getItem().completed = !this.getItem().completed;
    }
  }

  builder("body>div#appbody")
    .withDebugLogging()
    .withScopeItem("pluralize", (str, cnt) => (cnt != 1 ? str + "s" : str))
    .withPrototype(App.name, App)
    .withPrototype(Todo.name, Todo)
    .withInitializer(stage => {
      stage.setComponentFromRegistry(App.name);
      console.timeEnd();
    })
    .build()
    .start();
};

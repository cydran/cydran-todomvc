window.onload = function() {
	const builder = cydran.builder;
	const Component = cydran.Component;
	const Stage = cydran.stage;
	const StageBuilder = cydran.StageBuilder;

	const KEY_ENTER = 13;
	const KEY_ESC = 27;
	const APP_TEMPLATE = document.querySelector("template[id=app]").innerHTML.trim();

	class App extends Component {
    constructor() {
      super(APP_TEMPLATE);
      this.log = this.getLogger();
    }

    init() {
			this.todos = [];
			this.filteredTodos = [];
			this.allDone = false;
			this.editedTodo = null;
			this.remaining = 0;
    }

		addTodo() {
			// keyup enter
		}

		editTodo(todo) {

		}

		removeTodo(todo) {

		}

		finishEdit(todo) {
			// keyup enter -> doneEdit
			// keyup esc => cancelEdit
		}

		doneEdit(todo) {

		}

		cancelEdit(todo) {

		}

		removeCompleted() {

		}

  }

  builder("body")
    .withDebugLogging()
		.withScopeItem("pluralize", (str, cnt) => (cnt > 1) ? str + "s": str)
    .withPrototype(App.name, App)
    .withInitializer(stage => {
      stage.setComponentFromRegistry(App.name);
    })
    .build()
    .start();
};
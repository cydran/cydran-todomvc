import { TodoRepo } from "./data/repo.js";
import { TodoEntity } from "./data/TodoEntity.js";

const args = cydran.argumentsBuilder;
const builder = cydran.builder;
const Component = cydran.Component;
const PropertyKeys = cydran.PropertyKeys;
const Level = cydran.Level;

const KEY_ENTER = "Enter";
const KEY_ESC = "Escape";
const TODO_CHANNEL = "TODOS";
const RMV_TODO = "removeTodo";
const UP_TODO = "updateTodo";
const EMPTY_STR = "";

const PERSONALIZED = "todo.person";
const DATA_SRLZ_LVL = "data.serialize.level";
const PROPERTIES = {
	[PropertyKeys.CYDRAN_LOG_LEVEL]: false,
	// [PropertyKeys.CYDRAN_STRICT_ENABLED]: false,
	[PropertyKeys.CYDRAN_STRICT_STARTPHRASE]: "Sufficiently advanced incompetence is indistinguishable from malice. - Modified Clark's Law by J. Porter Clark",
	[`${PropertyKeys.CYDRAN_LOG_COLOR_PREFIX}.debug`]: "#00f900",
	[PropertyKeys.CYDRAN_LOG_LEVEL]: Level[Level.DEBUG],
	[PropertyKeys.CYDRAN_LOG_LABEL]: "ctdmvc",
	[PropertyKeys.CYDRAN_LOG_LABEL_VISIBLE]: false,
	[PropertyKeys.CYDRAN_LOG_PREAMBLE_ORDER]: "time:level:name",
	[PERSONALIZED]: EMPTY_STR,
	[DATA_SRLZ_LVL]: Level[Level.TRACE]
};

const template = (id) => document.querySelector(`template[id=${ id }]`).innerHTML.trim();

class App extends Component {
	constructor(who, newIds) {
		super(template(App.name.toLowerCase()));

		this.who = who || EMPTY_STR;
		this.newIds = newIds;


		this.remaining = 0;
		this.togAllDoneOrNot = false;
		this.newTodoValue = EMPTY_STR;

		this.watch("m().todos", () => {
			this.computeRemaining();
		});

		this.watch("m().filterVisiblity", () => this.repo.storeVisibleState(this.filterVisiblity));
		this.on(RMV_TODO).forChannel(TODO_CHANNEL).invoke(this.removeTodo);
		this.on(UP_TODO).forChannel(TODO_CHANNEL).invoke(this.updateTodo);
	}

	onMount() {
		this.repo = this.get(TodoRepo.name);
		this.todos = this.repo.getAll();
		this.filterVisiblity = this.repo.getVisibleState();
		this.filtered = this.withFilter("m().todos")
			.withPredicate("p(0) === 'all' || !v().completed && p(0) === 'active' || v().completed && p(0) === 'completed'", "m().filterVisiblity")
			.build();
		this.computeRemaining();
	}

	computeRemaining() {
		this.remaining = this.todos.filter(t => !t.completed).length;
	}

	addTodo(event) {
		if (event.code === KEY_ENTER) {
			let newTodo = this.get(TodoEntity.name);
			newTodo.title = this.newTodoValue;
			event.target.value = EMPTY_STR;
			this.todos.push(newTodo);
			this.repo.add(newTodo);
		} else if (event.code === KEY_ESC) {
			event.target.value = EMPTY_STR;
		}
	}

	removeTodo(todo) {
		const removeIdx = this.todos.findIndex(e => e.id === todo.id);
		if (removeIdx > -1) {
			this.todos.splice(removeIdx, 1);
			this.repo.remove(todo);
		}
	}

	updateTodo(todo) {
		this.repo.update(todo);
	}

	removeCompletedItems() {
		this.todos.filter(item => item.completed)
			.forEach(itm => {
				this.repo.remove(itm);
			});
		this.todos = this.todos.filter(item => !item.completed);
	}

	toggleAll() {
		this.todos.forEach(todo => todo.completed = !this.togAllDoneOrNot);
		this.togAllDoneOrNot = !this.togAllDoneOrNot;
		this.getLogger().ifDebug(() => `all items marked completed: ${this.togAllDoneOrNot}`);
	}
}

class TodoItem extends Component {
	constructor() {
		super(template(TodoItem.name.toLowerCase()));
		this.inEditMode = false;
		this.origEditText = EMPTY_STR;

		this.watch("v().completed", () => {
			this.broadcast(TODO_CHANNEL, UP_TODO, this.getValue());
		});
	}

	kill(event) {
		if (event.detail === 1) {
			this.broadcast(TODO_CHANNEL, RMV_TODO, this.getValue());
		}
	}

	edit() {
		this.inEditMode = !this.inEditMode;
		this.origEditText = this.getValue().title;
	}

	tryUpdate(event) {
		if (event.code === KEY_ENTER) {
			this.inEditMode = !this.inEditMode;
			this.origEditText = EMPTY_STR;
			this.broadcast(TODO_CHANNEL, UP_TODO, this.getValue());
		}
	}

	isComplete() {
		this.getValue().completed = !this.getValue().completed;
	}
}

builder("body>div#appbody", PROPERTIES)
	.withScopeItem("pluralize", (str, cnt) => (cnt !== 1 ? `${ str }s` : str))
	.withSingleton(TodoRepo.name, TodoRepo, args().withLogger(`${ App.name }[Repo]`, Level[Level.TRACE]).build())
	.withPrototype(App.name, App, args().withProperty(PERSONALIZED).withInstanceId(11).build())
	.withPrototype(TodoItem.name, TodoItem)
	.withPrototype(TodoEntity.name, TodoEntity)
	.withInitializer(stage => {
		stage.setComponentFromRegistry(App.name);
})
	.build()
	.start();

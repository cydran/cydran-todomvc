import TodoRepo from "./data/repo_dexiejs.js";
// import {argumentsBuilder as args, PropertyKeys, Level, StageImpl, uuidV4, Component} from "./node_modules/cydran/dist/cydran.js";

const args = cydran.argumentsBuilder;
const Component = cydran.Component;
const PropertyKeys = cydran.PropertyKeys;
const Level = cydran.Level;
const StageImpl = cydran.StageImpl;
const uuidV4 = cydran.uuidV4;

const PERSONALIZED = "todo.person";
const DATA_SRLZ_LVL = "data.serialize.level";
const PROPERTIES = {
	[PropertyKeys.CYDRAN_LOG_LEVEL]: false,
	// [PropertyKeys.CYDRAN_STRICT_ENABLED]: false,
	[PropertyKeys.CYDRAN_STRICT_STARTPHRASE]: "Before software can be reusable it first has to be usable. (Ralph Johnson)",
	[`${PropertyKeys.CYDRAN_LOG_COLOR_PREFIX}.debug`]: "#00f900",
	[PropertyKeys.CYDRAN_LOG_LEVEL]: Level[Level.DEBUG],
	[PropertyKeys.CYDRAN_LOG_LABEL]: "ctdmvc",
	[PropertyKeys.CYDRAN_LOG_LABEL_VISIBLE]: false,
	[PropertyKeys.CYDRAN_LOG_PREAMBLE_ORDER]: "time:level:name",
	[PERSONALIZED]: "",
	[DATA_SRLZ_LVL]: Level[Level.TRACE]
};

const KEY_ENTER = 'Enter';
const KEY_ESC = 'Escape';
const TODO_CHANNEL = "TODOS";
const RMV_TODO = "removeTodo";
const ADD_TODO = "addTodo";
const UP_TODO = "updateTodo";
const template = (id) => document.querySelector(`template[id=${id}]`).innerHTML.trim();

class TodoListItem {
	constructor(id) {
		this.id = id;
		this.title = null;
		this.completed = false;
		this.created = new Date();
	}
}

class App extends Component {
	constructor(who, newIds) {
		super(template(App.name.toLowerCase()));

		this.who = who || "";
		this.newIds = newIds;
		this.todos = [];
		this.$c().onExpressionValueChange("m().todos", () => { this.computeRemaining(); });

		this.remaining = 0;
		this.togAllDoneOrNot = false;
		this.newTodoValue = "";

		this.$c().onExpressionValueChange("m().filterVisiblity", () => this.repo.storeVisibleState(this.filterVisiblity));
		this.$c().onMessage(RMV_TODO).forChannel(TODO_CHANNEL).invoke(this.removeTodo);
		this.$c().onMessage(UP_TODO).forChannel(TODO_CHANNEL).invoke(this.updateTodo);
	}

	onMount() {
		this.repo = this.$c().getObject(TodoRepo.name);
		this.todos = this.repo.getAll().then(result => {
			return result;
		});
		this.filterVisiblity = this.repo.getVisibleState();
		this.filtered = this.$c().createFilter("m().todos")
			.withPredicate("p(0) === 'all' || !v().completed && p(0) === 'active' || v().completed && p(0) === 'completed'", "m().filterVisiblity")
			.build();
	}

	computeRemaining() {
		this.remaining = this.todos.filter(t => !t.completed).length;
	}

	addTodo(event) {
		if (event.code === KEY_ENTER) {
			let newTodo = new TodoListItem(uuidV4());
			newTodo.title = this.newTodoValue;
			event.target.value = "";
			this.todos.push(newTodo);
			this.repo.add(newTodo);
		} else if (event.code === KEY_ESC) {
			event.target.value = "";
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
		this.$c().getLogger().ifDebug(() => `all items marked done: ${this.togAllDoneOrNot}`);
	}
}

class TodoItem extends Component {
	constructor() {
		super(template(TodoItem.name.toLowerCase()));
		this.inEditMode = false;
		this.origEditText = "";
		this.dirty = false;

		this.$c().onExpressionValueChange("v().completed", () => {
			this.$c().send(UP_TODO, this.$c().getValue()).onChannel(TODO_CHANNEL).toContext();
		});
	}

	kill(event) {
		if (event.detail === 1) {
			this.$c().send(RMV_TODO, this.$c().getValue()).onChannel(TODO_CHANNEL).toContext();
		}
	}

	edit() {
		this.inEditMode = true;
		this.origEditText = this.$c().getValue().title;
	}

	tryUpdate(event) {
		if (event.code == KEY_ENTER) {
			this.inEditMode = !this.inEditMode;
			this.origEditText = "";
			this.$c().send(UP_TODO, this.$c().getValue()).onChannel(TODO_CHANNEL).toContext();
		}
	}

	isComplete() {
		this.$c().getValue().completed = !this.$c().getValue().completed;
	}
}

const stage = new StageImpl("body>div#appbody", PROPERTIES);
stage.addPreInitializer(stage => {
	stage.getScope().add("pluralize", (str, cnt) => (cnt !== 1 ? `${str}s` : str));
	stage.registerSingleton(TodoRepo.name, TodoRepo, args().withLogger(`${App.name}[Repo]`, stage.getProperties().getAsString(DATA_SRLZ_LVL)).build());
	stage.registerPrototype(TodoItem.name, TodoItem);
});
stage.addInitializer(stage => {
	stage.setComponent(new App(PROPERTIES.PERSONALIZED, 11));
})
stage.start();

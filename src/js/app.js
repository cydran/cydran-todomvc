import { TodoRepo, MSG } from "./data/repo.js";

// import { quotes } from "./data/quotes.js";
/*
import {argumentsBuilder as ab, PropertyKeys, uuidV4, Component} from "../node_modules/cydran/dist/cydran.js";
*/

const ab = cydran.argumentsBuilder;
const Component = cydran.Component;
const create = cydran.create;
const PropertyKeys = cydran.PropertyKeys;

const KEY_ENTER = "Enter";
const KEY_ESC = "Escape";
const TODO_CHANNEL = "TODOS";
const RMV_TODO = "removeTodo";
const UP_TODO = "updateTodo";
const EMPTY_STR = "";

const DATA_SRLZ_LVL = "data.serialize.level";
const PERSONALIZED = "todo.person";

const PROPERTIES = {
	[PERSONALIZED]: EMPTY_STR,
	[PropertyKeys.CYDRAN_STRICT_ENABLED]: true,
	[PropertyKeys.CYDRAN_STRICT_STARTPHRASE]: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code. (Dan Salomon)",
	[`${ PropertyKeys.CYDRAN_LOG_COLOR_PREFIX }.debug`]: "#00f900",
 	[PropertyKeys.CYDRAN_LOG_LEVEL]: "DEBUG",
	[PropertyKeys.CYDRAN_LOG_LABEL]: "ctdmvc",
	[PropertyKeys.CYDRAN_LOG_LABEL_VISIBLE]: false,
	[PropertyKeys.CYDRAN_LOG_PREAMBLE_ORDER]: "level:name",
	[DATA_SRLZ_LVL]: "TRACE"
};

const template = (id) => document.querySelector(`template[id=${id}]`).innerHTML.trim();

class TodoDTO {
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

		this.who = who || EMPTY_STR;
		this.newIds = newIds;
		this.todos = [];
		this.$c().onExpressionValueChange("m().todos", () => {
			this.computeRemaining();
		});

		this.remaining = 0;
		this.togAllDoneOrNot = false;
		this.newTodoValue = EMPTY_STR;

		this.$c().onExpressionValueChange("m().filterVisiblity", () => this.repo.storeVisibleState(this.filterVisiblity));

		this.$c().onMessage(RMV_TODO).forChannel(TODO_CHANNEL).invoke(this.removeTodo);

		this.$c().onMessage(UP_TODO).forChannel(TODO_CHANNEL).invoke(this.updateTodo);

		this.$c().onMessage(MSG.ALL).forChannel(MSG.CHAN).invoke((data) => {
			this.todos = data;
		});

		this.$c().onMessage(MSG.GS).forChannel(MSG.CHAN).invoke((data) => {
			this.filterVisiblity = data;
		});
	}

	onMount() {
		this.repo = this.$c().getObject(TodoRepo.name);
		this.repo.getVisibleState();
		this.repo.getAll();
		this.filtered = this.$c().createFilter("m().todos")
			.withPredicate("p(0) === 'all' || !v().completed && p(0) === 'active' || v().completed && p(0) === 'completed'", "m().filterVisiblity")
			.build();
	}

	computeRemaining() {
		this.remaining = this.todos.filter(t => !t.completed).length;
	}

	addTodo(event) {
		if (event.code === KEY_ENTER) {
			let newTodoItem = this.getContext().get(TodoDTO.name);
			newTodoItem.title = this.newTodoValue;
			event.target.value = EMPTY_STR;
			this.todos.push(newTodoItem);
			this.repo.add(newTodoItem);
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
		this.repo.getAll();
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
		this.origEditText = EMPTY_STR;
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
			this.origEditText = EMPTY_STR;
			this.$c().send(UP_TODO, this.$c().getValue()).onChannel(TODO_CHANNEL).toContext();
		}
	}

	isComplete() {
		this.$c().getValue().completed = !this.$c().getValue().completed;
	}
}

function rootCapability(ctxt) {
	ctxt.getScope().add("pluralize", (str, cnt) => (cnt !== 1 ? `${str}s` : str));
	ctxt.registerPrototype(TodoDTO.name, TodoDTO, ab().withFunction(self.crypto.randomUUID))
	ctxt.registerSingleton(TodoRepo.name, TodoRepo, ab()
		.withLogger(`${App.name}.Repo`, ctxt.getProperties().getAsString(DATA_SRLZ_LVL))
		.withPubSub()
		.build()
	);
	ctxt.registerPrototype(TodoItem.name, TodoItem);
}

quotes.forEach(q => {
	console.log(`${q.quote}\n\t${q.source}`);
});

const stage = create("body>div#appbody", PROPERTIES);
stage.addInitializer(stage => {
	stage.getContext().configure(rootCapability);
	stage.setComponent(new App(PROPERTIES[PERSONALIZED] ?? EMPTY_STR, 11));
});

stage.start();
window["stage"] = stage;

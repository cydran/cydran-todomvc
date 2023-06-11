import TodoRepo from "./data/repo_localstorage.js";
// import {argumentsBuilder as args, PropertyKeys, Level, StageImpl, uuidV4, Component} from "./node_modules/cydran/dist/cydran.js";

const args = cydran.argumentsBuilder;
const builder = cydran.builder;
const Component = cydran.Component;
const PropertyKeys = cydran.PropertyKeys;
const Level = cydran.Level;
const enumKeys = cydran.enumKeys;

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
const UP_TODO = "updateTodo";
const template = (id) => document.querySelector(`template[id=${id}]`).innerHTML.trim();


const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
const uuidV4 = () => {
	const chars = CHARS;
	const uuid = new Array(36);
	let rnd = 0;
	let r = null;

	for (let i = 0; i < 36; i++) {
		if (i === 8 || i === 13 || i === 18 || i === 23) {
			uuid[i] = '-';
		} else if (i === 14) {
			uuid[i] = '4';
		} else {
			if (rnd <= 0x02) {
				rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
			}

			r = rnd & 0xf;
			rnd = rnd >> 4;
			uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
		}
	}
	return uuid.join('');
}

class TodoListItem {
	constructor(id) {
		this.id = id;
		this.title = null;
		this.completed = false;
	}
}

class App extends Component {
	constructor(who, newIds) {
		super(template(App.name.toLowerCase()));

		this.who = who || "";
		this.newIds = newIds;


		this.remaining = 0;
		this.togAllDoneOrNot = false;
		this.newTodoValue = "";

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
		this.getLogger().ifDebug(() => `all items marked done: ${this.togAllDoneOrNot}`);
	}
}

class TodoItem extends Component {
	constructor() {
		super(template(TodoItem.name.toLowerCase()));
		this.inEditMode = false;
		this.origEditText = "";
		this.dirty = false;

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
			this.origEditText = "";
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
	.withInitializer(stage => {
		stage.setComponentFromRegistry(App.name);
})
	.build()
	.start();

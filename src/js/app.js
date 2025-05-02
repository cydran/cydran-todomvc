import { TodoRepo, MSG } from './data/repo.js';
import { TodoEntity } from './data/TodoEntity.js';

// import quotes from "./data/quotes.json" with {type: 'json'};
/*
import {argumentsBuilder as ab, PropertyKeys, uuidV4, Component} from "../node_modules/cydran/dist/cydran.js";
*/

const ab = cydran.argumentsBuilder;
const Component = cydran.Component;
const create = cydran.create;
const PropertyKeys = cydran.PropertyKeys;
const To = cydran.To;

const KEY_ENTER = 'Enter';
const KEY_ESC = 'Escape';
const EMPTY_STR = '';

const TODO_CHANNEL = 'TODOS';
const RMV_TODO = 'removeTodo';
const PATCH_TODO = 'patchTodo';

const DATA_SRLZ_LVL = 'cydran.logging.TodoRepo.level';
const PERSONALIZED = 'todo.person';

const PROPERTIES = {
	[PERSONALIZED]: EMPTY_STR,
	[PropertyKeys.CYDRAN_STRICT_ENABLED]: true,
	[PropertyKeys.CYDRAN_STRICT_STARTPHRASE]:
		"Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code. (Dan Salomon)",
	[`${PropertyKeys.CYDRAN_LOG_COLOR_PREFIX}.debug`]: '#00f900',
	[PropertyKeys.CYDRAN_LOG_LEVEL]: 'trace',
	[PropertyKeys.CYDRAN_LOG_LABEL]: 'ctdmvc',
	[PropertyKeys.CYDRAN_LOG_LABEL_VISIBLE]: false,
	[PropertyKeys.CYDRAN_LOG_PREAMBLE_ORDER]: 'level:name',
	[DATA_SRLZ_LVL]: 'trace'
};

const template = id =>
	document.querySelector(`template[id=${id}]`).innerHTML.trim();

class App extends Component {
	constructor() {
		super(template(App.name.toLowerCase()));

		this.filterVisiblity;
		this.todos = [];
		this.$c().onExpressionValueChange('m().todos', () =>
			this.computeRemaining()
		);
		this.$c().onExpressionValueChange('m().filterVisiblity', () =>
			this.repo.storeVisibleState(this.filterVisiblity)
		);

		this.remaining = 0;
		this.togAllDoneOrNot = false;
		this.newTodoValue = EMPTY_STR;

		// msgs from todo items
		this.$c().onMessage(RMV_TODO).forChannel(TODO_CHANNEL).invoke((payload) => {
			this.$c().getLogger(`Removing a todo item: ${payload.id}`);
			this.removeTodo(payload);
		});
		this.$c().onMessage(PATCH_TODO).forChannel(TODO_CHANNEL).invoke((payload) => {
			this.$c().getLogger(`Updating a todo item: ${payload.id}`)
			this.updateTodo(payload);
		});

		// msgs from the repo
		this.$c().onMessage(MSG.ALL).forChannel(MSG.CHAN).invoke(data => (this.todos = data));
		this.$c().onMessage(MSG.STATE).forChannel(MSG.CHAN).invoke(data => (this.filterVisiblity = data));
	}

	onMount() {
		this.repo = this.$c().getObject(TodoRepo.name);
		this.repo.getVisibleState();
		this.repo.getAll();
		this.filtered = this.$c()
			.createFilter('m().todos')
			.withPredicate(
				"p(0) === 'all' || !v().completed && p(0) === 'active' || v().completed && p(0) === 'completed'",
				'm().filterVisiblity'
			)
			.build();
	}

	computeRemaining() {
		this.remaining = this.todos.filter(t => !t.completed).length;
	}

	addTodo(event) {
		if (event.code === KEY_ENTER) {
			const newTodoItem = new TodoEntity(self.crypto.randomUUID());
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
		this.todos
			.filter(item => item.completed)
			.forEach(itm => {
				this.repo.remove(itm);
			});
		this.repo.getAll();
	}

	toggleAll() {
		this.todos.forEach(todo => (todo.completed = !this.togAllDoneOrNot));
		this.togAllDoneOrNot = !this.togAllDoneOrNot;
		this.$c()
			.getLogger()
			.ifDebug(() => `all items marked done: ${this.togAllDoneOrNot}`);
	}
}

class TodoItem extends Component {
	constructor() {
		super(template(TodoItem.name.toLowerCase()));
		this.inEditMode = false;
		this.origEditText = EMPTY_STR;
		this.dirty = false;

		this.$c().onExpressionValueChange('v().completed', () => {
			this.$c().send(To.GLOBALLY, TODO_CHANNEL, PATCH_TODO, this.$c().getValue());
		});
	}

	kill() {
		this.$c().send(To.GLOBALLY, TODO_CHANNEL, RMV_TODO, this.$c().getValue());
	}

	edit() {
		this.inEditMode = true;
		this.origEditText = this.$c().getValue().title;
	}

	tryUpdate(event) {
		if (event.code == KEY_ENTER) {
			this.inEditMode = !this.inEditMode;
			this.origEditText = EMPTY_STR;
			this.$c().send(To.GLOBALLY, TODO_CHANNEL, PATCH_TODO, this.$c().getValue());
		}
	}

	isComplete() {
		this.$c().getValue().completed = !this.$c().getValue().completed;
	}
}

function rootCapability(ctxt) {
	ctxt.getScope().add('pluralize', (str, cnt) => (cnt !== 1 ? `${str}s` : str));
	ctxt.registerPrototype(App.name, App);
	ctxt.registerSingleton(
		TodoRepo.name,
		TodoRepo,
		ab()
			.withLogger(
				`${App.name}.Repo`,
				ctxt.getProperties().getAsString(DATA_SRLZ_LVL)
			)
			.withTransmitter()
			.build()
	);
	ctxt.registerPrototype(TodoItem.name, TodoItem);
}

const stage = create('body>div#appbody', PROPERTIES, rootCapability);
stage.addInitializer(null, s => {
	s.setComponentByObjectId('App');
});

stage.start();
window['stage'] = stage;

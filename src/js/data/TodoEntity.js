export class TodoEntity {
	constructor(id) {
		this.id = id;
		this.title = null;
		this.completed = false;
		this.created = new Date();
	}
}

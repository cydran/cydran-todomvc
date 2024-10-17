export class TodoEntity {
	constructor(id) {
		this.id = id ?? self.crypto.randomUUID();
		this.title = null;
		this.completed = false;
		this.created = null;
		this.updated = null;
	}
}

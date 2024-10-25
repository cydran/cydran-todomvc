import { DB_NAME, VSTATE_KEY, DEF_STATE } from "/js/data/constants.js";
import { SCHEMA } from "/js/data/nano-sql-config.js";
import { Table } from "/js/data/constants.js";

const Acts = {
	UPS: "upsert",
	SEL: "select",
	DEL: "delete",
	TOT: "total"
};

export class TodoRepo {
	constructor(logger, pubSub) {
		this.ps = pubSub;
		this.logr = logger;

		nSQL().createDatabase({
			id: DB_NAME,
			mode: "PERM",
			tables: SCHEMA,
			version: 1,
			onVersionUpdate: (prevVersion) => { // migrate versions
				return new Promise((res, rej) => {
					switch (prevVersion) {
						case 1:
							// migrate v1 to v2
							res(prevVersion + 1);
							break;
						default:
							this.logr.ifDebug(() =>`no db migration to happen for nSQL`);
							break;
					}
		
				});
		
			}
		}).then(() => {
			// no-op
		}).catch(err => {
			this.logr.ifDebug(() => `db went sidewise: ${ err }`);
		});

		nSQL().useDatabase(DB_NAME);
		this.logr.ifDebug(() => `db ${ DB_NAME } ready to use`);
	}

	add(todo) {
		todo.created = new Date();
		this.upsert(todo, "created");
	}

	update(todo) {
		todo.updated = new Date();
		this.upsert(todo, "updated");
	}

	upsert(todo, act) {
		nSQL(Table.TODO).query(Acts.UPS, JSON.stringify(todo))
			.exec().then(async resp => {
				await this.logr.ifTrace(() => `${ act } todo: id = ${resp}`);
			}).catch(err => {
				this.logr.ifError(() => err);
			});
	}

	remove(todo) {
		nSQL(Table.TODO).query(Acts.DEL).where(["id", "==", todo.id])
			.exec().then(async resp => {
				await this.logr.ifTrace(() => `delete todo: id = ${todo.id}`);
			}).catch(err => {
				this.logr.ifError(() => err);
			});
	}

	getAll() {
		nSQL(Table.TODO).query(Acts.SEL)
			.exec().then(async result => {
				await this.ps.sendGlobally(MSG.CHAN, MSG.ALL, result);
				this.logr.ifTrace(() => result.length > 0 ? `retrieved all (${ result.length }) todos` : `no todos available`);
			}).catch(err => {
				this.ps.sendToContext(MSG.CHAN, MSG.ALL, []);
			});
	}

	storeVisibleState(vstate) {
		nSQL(Table.STATE).query(Acts.UPS, {VSTATE_KEY: vstate})
			.exec().then(async resp => {
				await this.logr.ifTrace(() => `stored visible state: ${vstate}`);
			}).catch(err => {
				this.logr.ifError(() => err);
			});
	}

	getVisibleState() {
		nSQL(Table.STATE).query(Acts.SEL).where(["id", "==", VSTATE_KEY])
			.exec().then(async resp => {
				const wkState = resp.value ?? DEF_STATE;
				await this.ps.sendGlobally(MSG.CHAN, MSG.GS, wkState);
				this.logr.ifTrace(() => `retrieve visible state`);
				return wkState;
			}).catch(err => {
				this.logr.ifError(() => err);
			});
	}

}

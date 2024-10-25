import { DB_NAME, Table } from "/js/data/constants.js";

const SCHEMA = [
	{
		name: Table.TODO,
		model: {
			"id:uuid": { pk: true },
			"name:string": {},
			"age:int": {}
		}
	}
]

nSQL().createDatabase({
	id: DB_NAME,
	mode: "PERM", // save changes to IndexedDB, WebSQL or SnapDB!
	tables: [ // tables can be created as part of createDatabase or created later with create table queries
		{
			name: "users",
			model: {
				"id:uuid": { pk: true },
				"name:string": {},
				"age:int": {}
			}
		}
	],
	version: 1,
	onVersionUpdate: (prevVersion) => { // migrate versions
		return new Promise((res, rej) => {
			switch (prevVersion) {
				case 1:
					// migrate v1 to v2
					res(2);
					break;
				case 2:
					// migrate v2 to v3
					res(3);
					break;
			}

		});

	}
}).then(() => {
	// ready to query!
}).catch(() => {
	// ran into a problem
});
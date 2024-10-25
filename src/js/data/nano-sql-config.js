import { Table } from "/js/data/constants.js";

export const SCHEMA = [
	{
		name: Table.TODO,
		model: {
			"id:uuid": { pk: true },
			"title:string": {},
			"completed:date": {},
			"created:date": {}
		}
	},
	{
		name: Table.STATE,
		model: {
			"id:string": { pk: true },
			"visibility:string": {}
		}
	}
];

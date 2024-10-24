import { Table } from "/js/data/constants.js";

export const SCHEMA = {
	[Table.TODO]: `id, title, completed, created`,
	[Table.STATE]: `id, visibility`
}
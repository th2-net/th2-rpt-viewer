import { Notebook, Tree } from '../models/JSONSchema';

export const isStringArray = (array: any[]): array is string[] =>
	array.every((val: string | Tree) => typeof val === 'string');

export const isSimpleLeaf = (
	leaf: string | number | string[] | Tree | Tree[] | undefined,
): leaf is string | number | string[] =>
	!!(
		leaf &&
		(typeof leaf === 'string' ||
			typeof leaf === 'number' ||
			(Array.isArray(leaf) && isStringArray(leaf)))
	);

export const isNotebook = (obj: Object): obj is Notebook => {
	const entries = Object.entries(obj);
	return (
		entries.length === 2 && typeof entries[0][1] === 'string' && typeof entries[1][1] === 'object'
	);
};

import { Tree } from '../models/JSONSchema';

export const isStringArray = (array: any[]): array is string[] =>
	array.every((val: string | Tree) => typeof val === 'string');

export const isSimpleLeaf = (
	leaf: string | string[] | Tree | Tree[] | undefined,
): leaf is string | string[] =>
	!!(leaf && (typeof leaf === 'string' || (Array.isArray(leaf) && isStringArray(leaf))));

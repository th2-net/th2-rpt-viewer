import { Tree } from '../models/Parser';

function isStringArray(array: any[]): array is string[] {
	return array.every((val: string | Tree) => typeof val === 'string');
}

export function isSimpleLeaf(
	leaf: string | string[] | Tree | Tree[] | undefined,
): leaf is string | string[] {
	return !!(leaf && (typeof leaf === 'string' || (Array.isArray(leaf) && isStringArray(leaf))));
}

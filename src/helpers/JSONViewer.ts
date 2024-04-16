import { nanoid } from 'nanoid';
import { Notebook, SimpleField, TreeNode } from '../models/JSONSchema';

export const isNotebook = (obj: Object): obj is Notebook => {
	const entries = Object.entries(obj);
	return (
		entries.length === 2 && typeof entries[0][1] === 'string' && typeof entries[1][1] === 'object'
	);
};

export const isKeyFailed = (key: string) => key.includes('[fail]') || key.trim().startsWith('#');
export const isValueFailed = (value: string) =>
	value.trim().startsWith('#') || value.trim().startsWith('!#');

export const convertJSONtoNode = (obj: object, key = ''): TreeNode => {
	const id = nanoid();
	let failed = isKeyFailed(key);
	const simpleFields: SimpleField[] = [];
	const complexFields: TreeNode[] = [];
	let viewInstruction = '';
	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) {
			if (typeof obj[i] === 'object') {
				const val = convertJSONtoNode(obj[i], i.toString());
				if (!failed && val.failed) failed = false;
				complexFields.push(val);
			} else {
				if (!failed && typeof obj[i] === 'string') failed = isValueFailed(obj[i]);
				simpleFields.push({ key: i.toString(), value: obj[i] });
			}
		}
	} else {
		const entries = Object.entries(obj);
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			if (entry[0] === 'view_instruction') {
				viewInstruction = String(entry[1]);
			} else if (typeof entry[1] === 'object' && entry[1] !== null) {
				const val = convertJSONtoNode(entry[1], entry[0]);
				if (!failed && val.failed) failed = false;
				complexFields.push(val);
			} else {
				if (!failed && typeof entry[1] === 'string') failed = isValueFailed(entry[1]);
				simpleFields.push({ key: entry[0], value: entry[1] });
			}
		}
	}
	return {
		id,
		key,
		failed,
		viewInstruction,
		simpleFields,
		complexFields,
	};
};

export const parseText = (text: string, name = ''): TreeNode[] => {
	const js = JSON.parse(text);
	const node = convertJSONtoNode(js);
	if (node.simpleFields.length > 0) {
		return [
			{
				...node,
				key: name,
			},
		];
	}
	return node.complexFields;
};

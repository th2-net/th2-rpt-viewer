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

export const convertJSONtoNode = (obj: object, key = '', isGeneratedKey = false): TreeNode => {
	const id = nanoid();
	let failed = isKeyFailed(key);
	const isArray = Array.isArray(obj);
	const simpleFields: SimpleField[] = [];
	const complexFields: TreeNode[] = [];
	let viewInstruction = '';
	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) {
			if (typeof obj[i] === 'object') {
				const val = convertJSONtoNode(obj[i], i.toString(), true);
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
			const [entryKey, value] = entries[i];
			if (entryKey === 'view_instruction') {
				viewInstruction = String(value);
			} else if (typeof value === 'object' && value !== null) {
				const val = convertJSONtoNode(value, entryKey);
				if (!failed && val.failed) failed = false;
				complexFields.push(val);
			} else {
				if (!failed && typeof value === 'string') failed = isValueFailed(value);
				simpleFields.push({ key: entryKey, value });
			}
		}
	}
	return {
		id,
		key,
		failed,
		isArray,
		isGeneratedKey,
		viewInstruction,
		simpleFields,
		complexFields,
	};
};

export const parseText = (text: string, name = '', isGeneratedKey = false): TreeNode[] => {
	const js = JSON.parse(text);
	const node = convertJSONtoNode(js, undefined, isGeneratedKey);
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

import { nanoid } from 'nanoid';
import moment from 'moment';
import {
	InputNotebookParameter,
	Notebook,
	NotebookParameter,
	SimpleField,
	TreeNode,
	TreeViewType,
} from '../models/JSONSchema';

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
	let displayName: string | undefined;
	let displayTable: string[][] | undefined;
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
			if (entryKey === '#display-table') {
				displayTable = value;
			} else if (entryKey === '#display-name') {
				displayName = String(value);
			} else if (entryKey === '#view-instruction') {
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
		displayTable,
		displayName,
		failed,
		isArray,
		isGeneratedKey,
		viewInstruction,
		viewType: TreeViewType.EVENTS_LIST,
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

const stringPunct = `'"\``;
const numberReg = /^-?\d*\.?\d{0,}$/;

export const convertParameterValue = (
	value: string,
	type: string,
	cutString = false,
): { value: number | string | boolean; type: string } => {
	try {
		switch (type) {
			case 'boolean': {
				return {
					value: value.toLocaleLowerCase() === 'true',
					type,
				};
			}
			case 'string': {
				return {
					value: cutString ? value.slice(1, value.length - 1) : value,
					type,
				};
			}
			case 'int': {
				return {
					value: Number.parseInt(value),
					type,
				};
			}
			case 'float': {
				return {
					value: Number.parseFloat(value),
					type,
				};
			}
			default: {
				return {
					value,
					type,
				};
			}
			case 'file path': {
				return {
					value: cutString ? value.slice(1, value.length - 1) : value,
					type,
				};
			}
			case 'timestamp': {
				return {
					value: cutString ? value.slice(1, value.length - 1) : value,
					type,
				};
			}
		}
	} catch {
		return {
			value,
			type,
		};
	}
};

export const validateParameter = (value: string, type: string): boolean => {
	switch (type) {
		case 'int': {
			return numberReg.test(value) && Number.isInteger(Number(value));
		}
		case 'float': {
			return numberReg.test(value);
		}
		case 'string': {
			return true;
		}
		case 'boolean': {
			return value.toLocaleLowerCase() === 'true' || value.toLocaleLowerCase() === 'false';
		}
		case 'file path': {
			return true;
		}
		case 'timestamp': {
			return moment.utc(value).isValid();
		}
		default: {
			return true;
		}
	}
};

export const getParameterType = (parameter: NotebookParameter) => {
	const { default: value, inferred_type_name: type, name } = parameter;

	if (type !== 'None') return type;
	if (name.endsWith('_timestamp')) {
		return 'timestamp';
	}
	if (name.endsWith('_file')) {
		return 'file path';
	}
	if (stringPunct.includes(value[0]) && value[0] === value[value.length - 1]) {
		return 'string';
	}
	if (value === 'True' || value === 'False') {
		return 'boolean';
	}
	if (numberReg.test(value)) {
		if (Number.isInteger(Number(value))) {
			return 'int';
		}
		return 'float';
	}
	return 'string';
};

export const convertParameterToInput = (parameter: NotebookParameter): InputNotebookParameter => {
	const type = getParameterType(parameter);
	return {
		name: parameter.name,
		value: String(convertParameterValue(parameter.default, type, true).value),
		type,
		isValid: validateParameter(parameter.default, type),
	};
};

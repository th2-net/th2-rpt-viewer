/** *****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

interface MessageMetadata {
	id: {
		connectionId: {
			sessionAlias: string;
		};
		sequence: string;
	};
	timestamp: string;
	messageType: string;
}

export default interface MessageBody {
	metadata: MessageMetadata;
	fields: MessageBodyFields;
}

export type MessageBodyFields = { [key: string]: MessageBodyField };

export function getMessageBodyFields(body: MessageBody | null): MessageBodyFields {
	return {
		fields: {
			messageValue: {
				fields: body?.fields || {},
			},
		},
		metadata: {
			...(body?.metadata
				? {
						messageValue: {
							fields: toBodyFields(body.metadata),
						},
				  }
				: { simpleValue: 'null' }),
		},
	};
}

const isPrimitive = (val: unknown): val is string | number | boolean => {
	return !(typeof val === 'object' || typeof val === 'function');
};

function getField(value: unknown): MessageBodyField {
	if (isPrimitive(value)) {
		return {
			simpleValue: value.toString(),
		};
	}

	if (Array.isArray(value)) {
		return {
			listValue: {
				values: value.map(getField),
			},
		};
	}

	return {
		messageValue: {
			fields: toBodyFields(value),
		},
	};
}

export function toBodyFields(obj: unknown): MessageBodyFields | undefined {
	if (!obj) return undefined;
	return Object.entries(obj as {}).reduce((acc, [key, value]) => {
		return {
			...acc,
			[key]: getField(value),
		};
	}, {} as MessageBodyFields);
}

export type ListValueField = {
	listValue: {
		values?: Array<MessageBodyField>;
	};
};

export type MessageValueField = {
	messageValue: {
		fields?: { [key: string]: MessageBodyField };
	};
};

export type SimpleValueField = {
	simpleValue: string;
};

export type MessageBodyField = ListValueField | MessageValueField | SimpleValueField;

export function isSimpleValue(field: MessageBodyField): field is SimpleValueField {
	return field != null && typeof (field as SimpleValueField).simpleValue === 'string';
}

export function isListValue(field: MessageBodyField): field is ListValueField {
	return field != null && typeof (field as ListValueField).listValue === 'object';
}

export function isMessageValue(field: MessageBodyField): field is MessageValueField {
	return field != null && typeof (field as MessageValueField).messageValue === 'object';
}

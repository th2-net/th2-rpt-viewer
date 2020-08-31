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

export default interface MessageBody {
	metadata: {
		id: {
			connectionId: {
				sessionAlias: string;
			};
			sequence: string;
		};
		timestamp: string;
		messageType: string;
	};
	fields: { [key: string]: MessageBodyField };
}

export type ListValueField = {
	listValue: {
		values: Array<MessageValueField>;
	};
};

export type MessageValueField = {
	messageValue: {
		fields: { [key: string]: MessageBodyField };
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

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

import { StatusType } from './Status';

export type EventBodyPayload =
	| MessagePayload
	| TablePayload
	| VerificationPayload
	| TreeTablePayload
	| ReferencePayload;

export enum EventBodyPayloadType {
	MESSAGE = 'message',
	TABLE = 'table',
	TREE_TABLE = 'treeTable',
	VERIFICATION = 'verification',
	REFERENCE = 'reference',
}

export interface MessagePayload {
	type: EventBodyPayloadType.MESSAGE;
	data: string;
}

export interface TablePayload {
	type: EventBodyPayloadType.TABLE;
	rows: Array<{ [column: string]: string }>;
}

export interface TreeTablePayload {
	type: EventBodyPayloadType.TREE_TABLE;
	name?: string;
	rows: {
		[rowName: string]: TreeTableRow | TreeTableCollection;
	};
}

export interface ReferencePayload {
	type: EventBodyPayloadType.REFERENCE;
	eventId: string;
}

export interface TreeTableRow {
	type: 'row';
	columns: {
		[column: string]: string;
	};
}

export interface TreeTableCollection {
	type: 'collection';
	rows: {
		[rowName: string]: TreeTableRow;
	};
}

export interface VerificationPayload {
	type: EventBodyPayloadType.VERIFICATION;
	fields: {
		[field: string]: VerificationPayloadField;
	};
	status: StatusType;
}

export interface VerificationPayloadField {
	type: 'field' | 'collection';
	operation: 'EQUAL' | 'NOT_EQUAL' | 'NOT_EMPTY';
	status: StatusType;
	key: boolean;
	actual: string;
	expected: string;
	hint?: string;
	fields?: {
		[field: string]: VerificationPayloadField;
	};
}

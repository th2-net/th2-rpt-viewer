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

import MessageBody from 'modules/messages/models/MessageBody';
import { OrderRule } from 'modules/messages/stores/MessageDisplayRulesStore';
import { ActionType } from './EventAction';
import { notEmpty } from '../helpers/object';

export enum MessageViewType {
	JSON = 'json',
	FORMATTED = 'formatted',
	ASCII = 'ASCII',
	BINARY = 'binary',
}

export type MessageViewTypeConfig = {
	setViewType: (vt: MessageViewType, id: string) => void;
	viewType?: MessageViewType;
};

export interface MessageSortOrderItem {
	id: string;
	item: string;
	timestamp: number;
}

export interface MessageDisplayRule {
	[x: string]: any;
	id: string;
	session: string;
	viewType: MessageViewType;
	removable: boolean;
	editableSession: boolean;
	editableType: boolean;
	timestamp: number;
}

export interface EventMessage {
	type: ActionType.MESSAGE;
	sequence: string;
	id: string;
	timestamp: string;
	direction: string;
	sessionId: string;
	rawMessageBase64: string | null;
	parsedMessages: ParsedMessage[] | null;
}

export interface ParsedMessage {
	match: boolean;
	id: string;
	message: MessageBody;
}

export function isMessageDisplayRule(obj: unknown): obj is MessageDisplayRule {
	return notEmpty(obj) && (obj as MessageDisplayRule).viewType !== undefined;
}

export function isMessageBodySortOrderItem(obj: unknown): obj is MessageSortOrderItem {
	return notEmpty(obj) && (obj as MessageSortOrderItem).item !== undefined;
}

export function isOrderRule(obj: unknown): obj is OrderRule {
	return notEmpty(obj) && (obj as OrderRule).order !== undefined;
}

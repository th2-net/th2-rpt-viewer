/** ****************************************************************************
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

import { nanoid } from 'nanoid';
import Action, { ActionNode, ActionNodeType } from '../../models/Action';
import TestCase from '../../models/TestCase';
import Message from '../../models/Message';
import { StatusType } from '../../models/Status';
import ActionParameter from '../../models/ActionParameter';
import Verification from '../../models/Verification';
import VerificationEntry from '../../models/VerificationEntry';
import SearchToken, { PanelSearchToken } from '../../models/search/SearchToken';
import KnownBug, { KnownBugNode } from '../../models/KnownBug';
import { KnownBugStatus } from '../../models/KnownBugStatus';
import KnownBugCategory from '../../models/KnownBugCategory';
import { TestCaseMetadata } from '../../models/TestcaseMetadata';
import SearchSplitResult from '../../models/search/SearchSplitResult';
import Panel from '../../util/Panel';

export function createVerification(
	messageId = 0,
	name = '',
	status: StatusType = StatusType.PASSED,
): Verification {
	return {
		actionNodeType: ActionNodeType.VERIFICATION,
		messageId,
		description: '',
		entries: [],
		name,
		status: {
			status,
			cause: null,
			description: null,
			details: null,
			reason: null,
		},
	};
}

export function createVerificationEntry(
	name = '',
	actual = '',
	expected = '',
	status = StatusType.PASSED,
): VerificationEntry {
	return {
		name,
		actual,
		expected,
		status,
		actualType: '',
		expectedType: '',
		hint: '',
		subEntries: [],
		exception: null,
		precision: undefined,
		systemPrecision: undefined,
		key: false,
		operation: '',
	};
}

export function createMessage(id = '0', msgName = 'test'): Message {
	return {
		actionNodeType: ActionNodeType.MESSAGE,
		id,
		msgName,
		raw: '',
		relatedActions: [],
		from: '',
		to: '',
		content: {},
		contentHumanReadable: '',
		timestamp: new Date().toString(),
	};
}

export function createSearchToken(
	pattern = 'test',
	color = 'default',
	isActive = false,
	isScrollable = true,
	panels: Panel[] = [Panel.ACTIONS, Panel.MESSAGES, Panel.KNOWN_BUGS, Panel.LOGS],
): PanelSearchToken {
	return {
		pattern,
		color,
		isActive,
		isScrollable,
		panels,
	};
}

export function createSearchSplitResult(
	content = '',
	token: SearchToken | null = null,
): SearchSplitResult {
	return {
		content,
		token,
	};
}

export function createKnownBug(id = 0, subject = '', relatedActionIds: number[] = []): KnownBug {
	return {
		actionNodeType: ActionNodeType.KNOWN_BUG,
		id,
		subject,
		relatedActionIds,
		status: KnownBugStatus.REPRODUCED,
	};
}

export function createKnownBugCategory(name = '', subNodes: KnownBugNode[] = []): KnownBugCategory {
	return {
		actionNodeType: ActionNodeType.KNOWN_BUG_CATEGORY,
		name,
		subNodes,
	};
}

export function createTestCase(
	id = '0',
	actions: ActionNode[] = [],
	messages: Message[] = [],
	status: StatusType = StatusType.PASSED,
): TestCase {
	return {
		actionNodeType: 'testCase',
		id,
		actions,
		messages,
		logs: [],
		bugs: [],
		type: '',
		order: 0,
		matrixOrder: 0,
		description: '',
		hash: 0,
		status: {
			status,
			cause: null,
			description: null,
			details: null,
			reason: null,
		},
		startTime: new Date().toString(),
		finishTime: new Date().toString(),
		hasErrorLogs: false,
		hasWarnLogs: false,
		files: {
			action: {
				count: 5,
				dataFiles: {},
				lastUpdate: '',
			},
			message: {
				count: 5,
				dataFiles: {},
				lastUpdate: '',
			},
		},
	};
}

export function createAction(
	id = 0,
	subNodes: ActionNode[] = [],
	name = '',
	parameters: ActionParameter[] = [],
	status: StatusType = StatusType.PASSED,
): Action {
	return {
		startTime: new Date().toString(),
		finishTime: new Date().toString(),
		actionNodeType: ActionNodeType.ACTION,
		name,
		id,
		subNodes,
		parameters,
		bugs: [],
		description: '',
		messageType: '',
		relatedMessages: [],
		isTruncated: false,
		verificationCount: 0,
		status: {
			status,
			cause: null,
			description: null,
			details: null,
			reason: null,
		},
	};
}

export function createTestCaseMetadata(
	order = 1,
	finishTime: string | null,
	hash: number,
	status: StatusType = StatusType.PASSED,
): TestCaseMetadata {
	return {
		order,
		startTime: new Date().toString(),
		finishTime,
		name: `TestCase-${order}`,
		status: {
			status,
			cause: null,
			description: null,
			details: null,
			reason: null,
		},
		id: order.toString(),
		hash,
		description: '',
		jsonFileName: '',
		jsonpFileName: '',
		bugs: [],
		failedActionCount: 0,
		firstActionId: 0,
		lastActionId: 0,
	};
}

export const createHeatmapInputData = (
	itemsLength: number,
	selectedItemsIndexes: Map<string, number[]>,
	pinnedItemsIndexes: number[],
) => {
	const items = Array(itemsLength)
		.fill(null)
		.map(() => nanoid());
	const pinnedItems = pinnedItemsIndexes.map(i => items[i]);
	const selectedItems: Map<string, string[]> = new Map();
	selectedItemsIndexes.forEach((indexes, color) =>
		selectedItems.set(
			color,
			indexes.map(i => items[i]),
		),
	);
	return {
		items,
		selectedItems,
		pinnedItems,
	};
};

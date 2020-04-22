/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import { observable, action, computed } from 'mobx';
import TestCase from '../models/TestCase';
import { StatusType } from '../models/Status';
import Action from '../models/Action';
import { getScrolledId } from '../helpers/array';
import SelectedState from '../state/models/SelectedState';
import Message from '../models/Message';
import KnownBug from '../models/KnownBug';
import { getActions } from '../helpers/action';
import { generateActionsMap } from '../helpers/mapGenerator';
import Log from '../models/Log';
import { appendRawContent, isRejected, isAdmin } from '../helpers/message';
import { getCheckpointActions } from '../helpers/checkpointFilter';
import { createTestCase, createAction } from '../__tests__/util/creators';
import ApiSchema from "../api/ApiSchema";

export const initialSelectedState: SelectedState = {
	testCase: null,
	actionsId: [],
	scrolledActionId: null,
	messagesId: [],
	scrolledMessageId: null,
	scrolledLogIndex: null,
	verificationId: null,
	selectedActionStatus: StatusType.NA,
	checkpointMessageId: null,
	checkpointActionId: null,
	rejectedMessageId: null,
	actionsMap: new Map<number, Action>(),
	activeActionId: null,
	selectedTestCaseId: null,
	actionsScrollHintsIds: [],
	messagesScrollHintsIds: [],
};


/* eslint-disable no-new-wrappers */
/* eslint-disable @typescript-eslint/ban-types */
export default class SelectedStore {

	private api: ApiSchema;

	constructor(api: ApiSchema) {
		this.api = api;
	}

	@observable selectedTestCaseId: string | null = null;

	@observable testCase: TestCase | null = null;

	@observable actionsId: number[] = [];

	@observable messagesId: number[] = [];

	@observable verificationId: number | null = null;

	@observable checkpointMessageId: number | null = null;

	@observable checkpointActionId: number | null = null;

	@observable rejectedMessageId: number | null = null;

	@observable selectedActionStatus: StatusType | null = StatusType.NA;

    /**
     * Map (id -> action)
     */
    @observable actionsMap: Map<number, Action> = new Map<number, Action>();

	// Number objects is used here because in some cases (eg one message / action was selected several times
	//	by different entities)
    // We can't understand that we need to scroll to the selected entity again when we are comparing primitive numbers.
    // Objects and reference comparison is the only way to handle numbers changing in this case.
	@observable scrolledActionId: Number | null = null;

	@observable scrolledMessageId: Number | null = null;

	@observable scrolledLogIndex: Number | null = null;

	@observable activeActionId: number | null = null;

	@observable actionsScrollHintsIds: Number[] = [];

	@observable messagesScrollHintsIds: Number[] = [];

	@action
	setTestCase = (testCase: TestCase) => {
		this.testCase = testCase;
	};

	@action
	updateTestCase = (testCase: TestCase) => {
		if (this.testCase !== null && testCase.order === this.testCase.order) {
			this.testCase = {
				...this.testCase,
				...testCase,
				status: testCase.status || {
					status: null,
					cause: null,
					description: null,
					reason: null,
					details: null,
				},
			};
		}
	};

	@action
	restTestCase = () => {
		this.testCase = null;
	};

	@action
	selectAction = (actionNode: Action, shouldScrollIntoView = false) => {
		this.actionsId = [actionNode.id];
		this.selectedActionStatus = actionNode.status.status;
		this.messagesId = actionNode.relatedMessages;
		this.verificationId = initialSelectedState.verificationId;
		this.scrolledActionId = shouldScrollIntoView
			? new Number(actionNode.id) : initialSelectedState.scrolledActionId;
		this.scrolledMessageId = getScrolledId(actionNode.relatedMessages, +this.messagesId);
		this.activeActionId = actionNode.id;
		this.checkpointActionId = initialSelectedState.checkpointActionId;
		this.checkpointMessageId = initialSelectedState.checkpointMessageId;
		this.actionsScrollHintsIds = initialSelectedState.actionsScrollHintsIds;
		this.messagesScrollHintsIds = initialSelectedState.messagesScrollHintsIds;
	};

	@action
	selectActionById = (actionId: number) => {
		this.actionsId = [actionId];
		this.selectedActionStatus = initialSelectedState.selectedActionStatus;
		this.scrolledActionId = new Number(actionId);
		this.activeActionId = actionId;
	};

	@action
	selectMessage = (message: Message, status: StatusType | null = null, shouldScrollIntoView = false) => {
		const relatedActions = message.relatedActions
			.filter(actionId => !status || (this.actionsMap.get(actionId)?.status.status === status));

		this.messagesId = [message.id];
		this.selectedActionStatus = status;
		this.actionsId = relatedActions;
		this.verificationId = message.id;
		this.scrolledActionId = getScrolledId(relatedActions, Number(this.scrolledActionId));
		this.scrolledMessageId = shouldScrollIntoView
			? new Number(message.id) : initialSelectedState.scrolledMessageId;
		this.activeActionId = relatedActions.length === 1 ? relatedActions[0] : initialSelectedState.activeActionId;
		this.checkpointActionId = initialSelectedState.checkpointActionId;
		this.checkpointMessageId = initialSelectedState.checkpointMessageId;
		this.actionsScrollHintsIds = initialSelectedState.actionsScrollHintsIds;
		this.messagesScrollHintsIds = initialSelectedState.messagesScrollHintsIds;
	};

	@action
	selectVerification = (
		messageId: number, rootActionId: number | null = null, status: StatusType = StatusType.NA,
	) => {
		this.verificationId = messageId;
		this.messagesId = [messageId];
		this.selectedActionStatus = status;
		this.actionsId = initialSelectedState.actionsId;
		this.scrolledMessageId = new Number(messageId);
		this.activeActionId = rootActionId;
		this.checkpointActionId = initialSelectedState.checkpointActionId;
		this.checkpointMessageId = initialSelectedState.checkpointMessageId;
		this.actionsScrollHintsIds = initialSelectedState.actionsScrollHintsIds;
		this.messagesScrollHintsIds = initialSelectedState.messagesScrollHintsIds;
	};

	@action
	selectCheckpointAction = (actionNode: Action) => {
		const { relatedMessages, id } = actionNode;

		this.checkpointMessageId = relatedMessages[0] || null;
		this.scrolledMessageId = relatedMessages[0] != null ? new Number(relatedMessages[0]) : null;
		this.checkpointActionId = id;
		this.scrolledActionId = new Number(id);
		this.activeActionId = initialSelectedState.activeActionId;
		this.actionsId = initialSelectedState.actionsId;
		this.messagesId = initialSelectedState.messagesId;
		this.verificationId = initialSelectedState.verificationId;
		this.actionsScrollHintsIds = initialSelectedState.actionsScrollHintsIds;
		this.messagesScrollHintsIds = initialSelectedState.messagesScrollHintsIds;
	};

	@action
	selectCheckpointMessage = (message: Message) => {
		const { relatedActions, id } = message;

		this.checkpointMessageId = id;
		this.scrolledMessageId = new Number(id);
		this.checkpointActionId = relatedActions[0] != null ? relatedActions[0] : null;
		this.scrolledActionId = relatedActions[0] != null ? new Number(relatedActions[0]) : null;
		this.messagesId = initialSelectedState.messagesId;
		this.activeActionId = initialSelectedState.activeActionId;
		this.actionsId = initialSelectedState.actionsId;
		this.verificationId = initialSelectedState.verificationId;
		this.actionsScrollHintsIds = initialSelectedState.actionsScrollHintsIds;
		this.messagesScrollHintsIds = initialSelectedState.messagesScrollHintsIds;
	};

	@action
	setSelectedTestCase = (testCaseId: string) => {
		this.selectedTestCaseId = testCaseId;
	};

	@action
	selectKnownBug = (knownBug: KnownBug, status: StatusType | null = null) => {
		const actionsId = status != null
			? knownBug.relatedActionIds
				.filter(id => this.actionsMap.get(id)?.status.status === status)
			: knownBug.relatedActionIds;

		this.selectedActionStatus = status;
		this.actionsId = actionsId;
		this.scrolledActionId = getScrolledId(actionsId, Number(this.scrolledActionId));
		this.actionsScrollHintsIds = initialSelectedState.actionsScrollHintsIds;
		this.messagesScrollHintsIds = initialSelectedState.messagesScrollHintsIds;
	};


	@action
	addTestCaseActions = (actions: Action[], testCaseOrder: number) => {
		if (this.testCase !== null && this.testCase.order === testCaseOrder) {
			const updatedActions = [...this.testCase.actions, ...actions];

			this.actionsMap = generateActionsMap(getActions(updatedActions));
			this.testCase.actions = updatedActions;
		}
	};

	@action
	addTestCaseLogs = (logs: Log[], testCaseOrder: number) => {
		if (this.testCase !== null && this.testCase.order === testCaseOrder) {
			this.testCase.logs = [...this.testCase.logs, ...logs];
		}
	};

	@action
	addTestCaseMessages = (messages: Message[], testCaseOrder: number) => {
		if (this.testCase !== null && this.testCase.order === testCaseOrder) {
			this.testCase.messages = [
				...this.testCase.messages,
				...messages.map(appendRawContent),
			];
		}
	};

	@action
	selectRejectedMessage = (messageId: number) => {
		this.rejectedMessageId = messageId;
		this.scrolledMessageId = new Number(messageId);
	};

	@computed get messages() {
		return this.testCase?.messages || [];
	}

	@computed get actions() {
		return this.testCase?.actions || [];
	}

	@computed get logs() {
		return this.testCase?.logs || [];
	}

	@computed get bugs() {
		return this.testCase?.bugs || [];
	}

	@computed get checkpointActions() {
		return getCheckpointActions(this.actions);
	}

	@computed get currentCheckpoint() {
		return this.checkpointActions.find(cp => cp.id === this.checkpointActionId);
	}

	@computed get isCheckpointsEnabled() {
		return this.checkpointActions.length > 0;
	}

	@computed get rejectedMessages() {
		return this.messages.filter(isRejected);
	}

	@computed get adminMessages() {
		return this.messages.filter(isAdmin);
	}

	@action
	loadTestCase = (jsonPfilename: string) => {
		this.testCase = createTestCase('0', [createAction(1)], []);
	};
}

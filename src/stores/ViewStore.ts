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

import {
	observable,
	action,
	computed,
	reaction,
} from 'mobx';
import Panel from '../util/Panel';
import PanelArea from '../util/PanelArea';
import SearchParams from '../util/SearchParams';

// eslint-disable-next-line eqeqeq
const showMessagesInitialValue = new URLSearchParams(window.location.search).get(SearchParams.messages) == 'true';

export default class AppViewStore {
	constructor() {
		reaction(
			() => this.showMessages,
			this.onViewChange,
		);
	}

	@observable isLoading = true;

	@observable adminMessagesEnabled = new Boolean(false);

	@observable beautifiedMessages: string[] = [];

	@observable leftPanel: Panel.ACTIONS | Panel.STATUS = Panel.ACTIONS;

	@observable rightPanel: Panel.MESSAGES | Panel.KNOWN_BUGS | Panel.LOGS = Panel.MESSAGES;

	@observable panelArea: PanelArea = PanelArea.P50;

	@observable showMessages = showMessagesInitialValue;

	@action
	setAdminMsgEnabled = (adminEnabled: boolean) => {
		this.adminMessagesEnabled = new Boolean(adminEnabled);
	};

	@action
	uglifyAllMessages = () => {
		this.beautifiedMessages = [];
	};

	@action
	setLeftPane = (panel: Panel.ACTIONS | Panel.STATUS) => {
		this.leftPanel = panel;
	};

	@action
	setRightPane = (panel: Panel.MESSAGES | Panel.KNOWN_BUGS | Panel.LOGS) => {
		this.rightPanel = panel;
	};

	@action
	setPanelArea = (panelArea: PanelArea) => {
		this.panelArea = panelArea;
	};

	@action
	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};

	@action
	toggleBeautify = (messageId: string) => {
		if (this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
			return;
		}
		this.beautifiedMessages = [...this.beautifiedMessages, messageId];
	};

	@computed get isLeftPanelClosed() {
		return this.panelArea === PanelArea.P0;
	}

	@computed get isRightPanelClosed() {
		return this.panelArea === PanelArea.P100;
	}

	private onViewChange = () => {
		const params = new URLSearchParams();
		if (this.showMessages) {
			params.set(SearchParams.messages, this.showMessages.toString());
		} else {
			params.delete(SearchParams.messages);
		}
		window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
	};
}

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

import { action, observable } from 'mobx';
import moment from 'moment';
import { EventMessage, MessageViewType, ParsedMessage } from 'models/EventMessage';
import { downloadTxtFile } from 'helpers/files/downloadTxt';
import { decodeBase64RawContent, getAllRawContent } from '../helpers/rawFormatter';

export default class MessagesExportStore {
	@observable
	public isExport = false;

	@observable.shallow
	public exportMessages: Array<EventMessage> = [];

	public isExported(message: EventMessage) {
		return this.exportMessages.includes(message);
	}

	@action
	public addMessageToExport = (message: EventMessage) => {
		if (!this.isExport) return;
		if (this.isExported(message)) {
			this.exportMessages = this.exportMessages.filter(exportMessage => exportMessage !== message);
		} else {
			this.exportMessages.push(message);
		}
	};

	@action
	public enableExport = () => {
		this.isExport = true;
		this.exportMessages = [];
	};

	@action
	public disableExport = () => {
		this.isExport = false;
		this.exportMessages = [];
	};

	private convertMessage(
		messageToConvert: EventMessage,
		parsedMessage: ParsedMessage,
		messageViewType: MessageViewType,
	) {
		let content: string;

		const jsonToCopy = parsedMessage;

		switch (messageViewType) {
			case MessageViewType.ASCII:
				content = messageToConvert.rawMessageBase64 ? atob(messageToConvert.rawMessageBase64) : '';
				break;
			case MessageViewType.BINARY:
				content = messageToConvert.rawMessageBase64
					? getAllRawContent(decodeBase64RawContent(messageToConvert.rawMessageBase64))
					: '';
				break;
			case MessageViewType.FORMATTED:
				content = jsonToCopy ? JSON.stringify(jsonToCopy, null, 4) : '';
				break;
			case MessageViewType.JSON:
				content = jsonToCopy ? JSON.stringify(jsonToCopy) : '';
				break;
			default:
				content = '';
		}

		return content;
	}

	@action
	public endExport = (messageViewType: MessageViewType) => {
		this.isExport = false;
		if (this.exportMessages.length === 0) return;
		downloadTxtFile(
			[
				this.exportMessages
					.map(exportMessage =>
						exportMessage.parsedMessages?.map(parsedMessage =>
							this.convertMessage(exportMessage, parsedMessage, messageViewType),
						),
					)
					.join('\n'),
			],
			`exported_messages_${moment.utc().toISOString()}.txt`,
		);
		this.exportMessages = [];
	};
}

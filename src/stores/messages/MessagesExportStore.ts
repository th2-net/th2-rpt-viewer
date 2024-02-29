import { action, observable } from 'mobx';
import moment from 'moment';
import { EventMessage, MessageViewType, MessagesOrderForExport } from '../../models/EventMessage';
import { decodeBase64RawContent, getAllRawContent } from '../../helpers/rawFormatter';
import { downloadTxtFile } from '../../helpers/files/downloadTxt';

export default class MessagesExportStore {
	@observable
	public isExport = false;

	@observable
	private exportOrder: MessagesOrderForExport = MessagesOrderForExport.DEFAULT;

	@observable.shallow
	public exportMessages: Array<EventMessage> = [];

	public isExported(message: EventMessage) {
		return this.exportMessages.includes(message);
	}

	public get currentExportOrder() {
		return this.exportOrder;
	}

	@action
	public addMessageToExport(message: EventMessage) {
		if (!this.isExport) return;
		if (this.isExported(message)) {
			this.exportMessages = this.exportMessages.filter(exportMessage => exportMessage !== message);
		} else {
			this.exportMessages.push(message);
		}
	}

	@action
	public addAllMessagesToExport(messages: EventMessage[]) {
		if (!this.isExport) return;

		const containsAllElements = messages.every(element => this.exportMessages.includes(element));

		if (!containsAllElements) {
			this.exportMessages.splice(0, this.exportMessages.length, ...messages);
		} else {
			this.exportMessages.splice(0, this.exportMessages.length);
		}
	}

	@action
	public setExportOrder = (order: MessagesOrderForExport) => {
		if (order === this.exportOrder) return;
		this.exportOrder = order;
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

	private convertMessage(messageToConvert: EventMessage, messageViewType: MessageViewType) {
		let content: string;

		const jsonToCopy = messageToConvert.body;

		switch (messageViewType) {
			case MessageViewType.ASCII:
				content = messageToConvert.bodyBase64 ? atob(messageToConvert.bodyBase64) : '';
				break;
			case MessageViewType.BINARY:
				content = messageToConvert.bodyBase64
					? getAllRawContent(decodeBase64RawContent(messageToConvert.bodyBase64))
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

		if (this.exportOrder === MessagesOrderForExport.CHRONOLOGICALLY) {
			this.exportMessages.splice(0, this.exportMessages.length, ...this.exportMessages.reverse());
		}

		downloadTxtFile(
			[
				this.exportMessages
					.map(exportMessage => this.convertMessage(exportMessage, messageViewType))
					.join('\n'),
			],
			`exported_messages_${moment.utc().toISOString()}.txt`,
		);
		this.exportMessages = [];
	};
}

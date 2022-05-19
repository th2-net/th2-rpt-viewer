import { action, observable } from 'mobx';
import moment from 'moment';
import {
	EventMessage,
	MessageViewType,
	ParsedMessage,
	EventMessageItem,
} from '../../models/EventMessage';
import { decodeBase64RawContent, getAllRawContent } from '../../helpers/rawFormatter';
import { downloadTxtFile } from '../../helpers/files/downloadTxt';

export default class MessagesExportStore {
	@observable
	public isExport = false;

	@observable.shallow
	public exportMessages: Array<EventMessageItem> = [];

	public isExported(message: EventMessageItem) {
		return this.exportMessages.includes(message);
	}

	@action
	public addMessageToExport(message: EventMessageItem) {
		if (!this.isExport) return;
		if (this.isExported(message)) {
			this.exportMessages = this.exportMessages.filter(exportMessage => exportMessage !== message);
		} else {
			this.exportMessages.push(message);
		}
	}

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
					.map(exportMessage => {
						return exportMessage.parsedMessages?.map(parsedMessage =>
							this.convertMessage(exportMessage, parsedMessage, messageViewType),
						);
					})
					.join('\n'),
			],
			`exported_messages_${moment.utc().toISOString()}.txt`,
		);
		this.exportMessages = [];
	};
}

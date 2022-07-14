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

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createBemElement } from '../../../helpers/styleCreators';
import { EventMessage, MessageViewType, ParsedMessage } from '../../../models/EventMessage';
import { useOutsideClickListener } from '../../../hooks/useOutsideClickListener';
import { decodeBase64RawContent, getAllRawContent } from '../../../helpers/rawFormatter';
import { copyTextToClipboard } from '../../../helpers/copyHandler';
import { showNotification } from '../../../helpers/showNotification';
import { normalizeFields } from '../../../helpers/message';
import useViewMode from '../../../hooks/useViewMode';
import { ViewMode } from '../../../contexts/viewModeContext';
import { Apps, CrossOriginMessage } from '../../../models/PostMessage';

const COPY_NOTIFICATION_TEXT = 'Text copied to the clipboard!';

const JSON_COPY_OPTIONS = ['body', 'fields'] as const;

export type MessageCardToolsProps = {
	message: EventMessage;
	isBookmarked?: boolean;
	toggleMessagePin?: () => void;
};

type OwnProps = {
	viewType?: MessageViewType;
	setViewType: (vt: MessageViewType, id: string) => void;
	parsedMessage?: ParsedMessage;
	isScreenshotMsg: boolean;
};

const MessageCardTools = ({
	message,
	parsedMessage,
	isBookmarked,
	toggleMessagePin,
	viewType,
	setViewType,
	isScreenshotMsg,
}: MessageCardToolsProps & OwnProps) => {
	const { id } = message;

	const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const appViewMode = useViewMode();

	useOutsideClickListener(rootRef, (e: MouseEvent) => {
		if (e.target instanceof Element && rootRef.current && !rootRef.current.contains(e.target)) {
			setIsViewMenuOpen(false);
		}
	});

	const viewTypes = parsedMessage
		? [MessageViewType.JSON, MessageViewType.FORMATTED]
		: [MessageViewType.BINARY, MessageViewType.ASCII];

	function onCopy(jsonObjectToCopy: 'body' | 'fields' = 'body') {
		let content: string;

		const jsonToCopy =
			jsonObjectToCopy === 'fields'
				? parsedMessage?.message.fields
					? normalizeFields(parsedMessage.message.fields)
					: null
				: parsedMessage;

		switch (viewType) {
			case MessageViewType.ASCII:
				content = message.rawMessageBase64 ? atob(message.rawMessageBase64) : '';
				break;
			case MessageViewType.BINARY:
				content = message.rawMessageBase64
					? getAllRawContent(decodeBase64RawContent(message.rawMessageBase64))
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

		if (content) {
			copyTextToClipboard(content);
			showNotification(COPY_NOTIFICATION_TEXT);
		}
	}

	const isRawViewType = viewType === MessageViewType.ASCII || viewType === MessageViewType.BINARY;

	const toggleViewType = (v: MessageViewType) => {
		setViewType(v, parsedMessage ? parsedMessage.id : message.id);
	};

	return (
		<div className='message-card-tools' ref={rootRef}>
			<div
				className={createBemElement(
					'message-card-tools',
					'button',
					isViewMenuOpen ? 'active' : null,
				)}
				onClick={() => setIsViewMenuOpen(isOpen => !isOpen)}>
				<div className='message-card-tools__ellipsis' />
			</div>
			<MessagePopup isOpen={isViewMenuOpen}>
				<div className='message-card-tools__header'>
					<span>View</span>
					<div
						className='message-card-tools__header-close'
						onClick={() => setIsViewMenuOpen(false)}
					/>
				</div>
				{!isScreenshotMsg && (
					<div className='message-card-tools__controls-group'>
						{viewTypes.map(currentViewType => {
							const iconClassName = createBemElement('message-card-tools', 'icon', currentViewType);
							const indicatorClassName = createBemElement(
								'message-card-tools',
								'indicator',
								currentViewType === viewType ? 'active' : null,
							);

							return (
								<div
									title={currentViewType}
									className='message-card-tools__item'
									key={currentViewType}
									onClick={() => toggleViewType(currentViewType)}>
									<div className={iconClassName} />
									<span className='message-card-tools__item-title'>{currentViewType}</span>
									<div className={indicatorClassName} />
								</div>
							);
						})}
					</div>
				)}
				<div className='message-card-tools__line' />
				<div className='message-card-tools__header'>
					<span>Action</span>
				</div>
				{toggleMessagePin && (
					<div className='message-card-tools__controls-group'>
						<div className='message-card-tools__item' onClick={() => toggleMessagePin()}>
							<div
								className={createBemElement(
									'message-card-tools',
									'icon',
									'bookmark',
									'action',
									isBookmarked ? 'pinned' : null,
								)}
							/>
							<span className='message-card-tools__item-title'>Bookmark</span>
						</div>
					</div>
				)}
				{!isScreenshotMsg && (
					<div className='message-card-tools__controls-group'>
						{isRawViewType ? (
							<div
								title='Copy content to clipboard'
								className='message-card-tools__item'
								onClick={() => onCopy()}>
								<div className='message-card-tools__copy-icon' />
								<span className='message-card-tools__item-title'>Copy</span>
								<div className={createBemElement('message-card-tools', 'indicator', 'bookmark')} />
							</div>
						) : (
							JSON_COPY_OPTIONS.map(copyOption => (
								<div
									key={copyOption}
									title='Copy content to clipboard'
									className='message-card-tools__item'
									onClick={() => {
										onCopy(copyOption);
										setIsViewMenuOpen(false);
									}}>
									<div className='message-card-tools__copy-icon' />
									<span className='message-card-tools__item-title'>
										{copyOption === 'body' ? 'Copy full' : 'Copy simplified'}
									</span>
									<div
										className={createBemElement('message-card-tools', 'indicator', 'bookmark')}
									/>
								</div>
							))
						)}
					</div>
				)}
				{isScreenshotMsg && (
					<a
						className='message-card-tools__item'
						download={`${id}.${parsedMessage?.message.metadata.messageType.replace('image/', '')}`}
						href={`data:${parsedMessage?.message.metadata.messageType};base64,${
							message.rawMessageBase64 || ''
						}`}>
						<div className='message-card-tools__icon download' />
					</a>
				)}
				{appViewMode === ViewMode.EmbeddedMessages && (
					<div className='message-card-tools__controls-group'>
						{parsedMessage && (
							<div
								title='Send to history'
								className='message-card-tools__item'
								onClick={() => {
									const isDev = process.env.NODE_ENV === 'development';

									window.parent.postMessage(
										{
											payload: {
												...message,
												jsonBody: JSON.stringify(
													normalizeFields(parsedMessage.message.fields),
													null,
													'    ',
												),
											} as unknown,
											action: 'replayMessage',
											publisher: Apps.ReportViewer,
										} as CrossOriginMessage,
										isDev ? 'http://localhost:9002' : window.location.origin,
									);
									setIsViewMenuOpen(false);
								}}>
								<div className='message-card-tools__copy-icon' />
								<span className='message-card-tools__item-title'>Send to replay</span>
								<div className={createBemElement('message-card-tools', 'indicator', 'bookmark')} />
							</div>
						)}
					</div>
				)}
			</MessagePopup>
		</div>
	);
};

export default MessageCardTools;

interface MessagePopupProps {
	isOpen: boolean;
	children: React.ReactNode;
}

function MessagePopup({ isOpen, children }: MessagePopupProps) {
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className='message-card-tools__controls'
					style={{ transformOrigin: 'top' }}
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.5 }}
					transition={{ duration: 0.15, ease: 'easeOut' }}>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

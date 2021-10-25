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
import { EventMessage, MessageViewType } from '../../../models/EventMessage';
import { useOutsideClickListener } from '../../../hooks/useOutsideClickListener';
import { decodeBase64RawContent, getAllRawContent } from '../../../helpers/rawFormatter';
import { copyTextToClipboard } from '../../../helpers/copyHandler';
import { showNotification } from '../../../helpers/showNotification';
import { normalizeFields } from '../../../helpers/message';
import useViewMode from '../../../hooks/useViewMode';
import { ViewMode } from '../../../contexts/viewModeContext';
import { CrossOriginMessage } from '../../../models/PostMessage';

const COPY_NOTIFICATION_TEXT = 'Text copied to the clipboard!';

export type MessageCardToolsConfig = {
	message: EventMessage;
	messageId: string;
	messageType: string;
	messageViewType: MessageViewType;
	toggleViewType: (viewType: MessageViewType) => void;
	isBookmarked: boolean;
	toggleMessagePin: () => void;
	isScreenshotMsg: boolean;
	isEmbedded?: boolean;
};

const MessageCardTools = ({
	message,
	messageId,
	messageType,
	messageViewType,
	toggleViewType,
	isBookmarked,
	toggleMessagePin,
	isScreenshotMsg,
	isEmbedded,
}: MessageCardToolsConfig) => {
	const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const appViewMode = useViewMode();

	useOutsideClickListener(rootRef, (e: MouseEvent) => {
		if (e.target instanceof Element && rootRef.current && !rootRef.current.contains(e.target)) {
			setIsViewMenuOpen(false);
		}
	});

	const viewTypes = message.body
		? [
				MessageViewType.JSON,
				MessageViewType.FORMATTED,
				MessageViewType.BINARY,
				MessageViewType.ASCII,
		  ]
		: [MessageViewType.BINARY, MessageViewType.ASCII];

	function onCopy(jsonObjectToCopy: 'body' | 'fields' = 'body') {
		let content: string;

		const jsonToCopy =
			jsonObjectToCopy === 'fields'
				? message.body?.fields
					? normalizeFields(message.body.fields)
					: null
				: message.body;

		switch (messageViewType) {
			case MessageViewType.ASCII:
				content = message.bodyBase64 ? atob(message.bodyBase64) : '';
				break;
			case MessageViewType.BINARY:
				content = message.bodyBase64
					? getAllRawContent(decodeBase64RawContent(message.bodyBase64))
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
				{!isEmbedded && (
					<div className='message-card-tools__controls-group'>
						<div className='message-card-tools__item' onClick={() => toggleMessagePin()}>
							<span className='message-card-tools__item-title'>
								{isBookmarked ? 'Remove bookmark' : 'Bookmark'}
							</span>
							<div
								className={createBemElement(
									'message-card-tools',
									'icon',
									'bookmark',
									isBookmarked ? 'pinned' : null,
								)}
							/>

							<div
								className={createBemElement(
									'message-card-tools',
									'indicator',
									'bookmark',
									isBookmarked ? 'active' : null,
								)}
							/>
						</div>
					</div>
				)}
				{!isScreenshotMsg && (
					<div className='message-card-tools__controls-group'>
						{viewTypes.map(viewType => {
							const iconClassName = createBemElement('message-card-tools', 'icon', viewType);
							const indicatorClassName = createBemElement(
								'message-card-tools',
								'indicator',
								viewType === messageViewType ? 'active' : null,
							);

							return (
								<div
									title={viewType}
									className='message-card-tools__item'
									key={viewType}
									onClick={() => toggleViewType(viewType)}>
									<span className='message-card-tools__item-title'>{viewType}</span>
									<div className={iconClassName} />
									<div className={indicatorClassName} />
								</div>
							);
						})}
					</div>
				)}
				{!isScreenshotMsg &&
					(messageViewType === MessageViewType.JSON ||
						messageViewType === MessageViewType.FORMATTED) && (
						<div className='message-card-tools__controls-group'>
							{['body', 'fields'].map(copyOption => (
								<div
									key={copyOption}
									title='Copy content to clipboard'
									className='message-card-tools__item'
									onClick={() => {
										onCopy(copyOption as 'body' | 'fields');
										setIsViewMenuOpen(false);
									}}>
									<span className='message-card-tools__item-title'>
										{copyOption === 'body' ? 'Copy full' : 'Copy simplified'}
									</span>
									<div className='message-card-tools__copy-icon' />
									<div
										className={createBemElement('message-card-tools', 'indicator', 'bookmark')}
									/>
								</div>
							))}
						</div>
					)}
				{isScreenshotMsg && (
					<>
						<a
							className='message-card-tools__item'
							download={`${messageId}.${messageType.replace('image/', '')}`}
							href={`data:${message.messageType};base64,${message.bodyBase64 || ''}`}>
							<div className='message-card-tools__icon download' />
						</a>
					</>
				)}
				{appViewMode === ViewMode.EmbeddedMessages && (
					<div className='message-card-tools__controls-group'>
						<div
							title='Send to history'
							className='message-card-tools__item'
							onClick={() => {
								const isDev = process.env.NODE_ENV === 'development';

								window.parent.postMessage(
									{
										payload: {
											...message,
											jsonBody: message.body && normalizeFields(message.body?.fields),
										} as unknown,
										action: 'replayMessage',
									} as CrossOriginMessage,
									isDev ? 'http://localhost:9002' : window.location.origin,
								);
								setIsViewMenuOpen(false);
							}}>
							<span className='message-card-tools__item-title'>Send to replay</span>
							<div className='message-card-tools__copy-icon' />
							<div className={createBemElement('message-card-tools', 'indicator', 'bookmark')} />
						</div>
					</div>
				)}
			</MessagePopup>
			{!isScreenshotMsg &&
				(messageViewType === MessageViewType.ASCII ||
					messageViewType === MessageViewType.BINARY) && (
					<div className='message-card-tools__copy-all' title='Copy content to clipboard'>
						<div className='message-card-tools__copy-icon' onClick={() => onCopy()} />
					</div>
				)}
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

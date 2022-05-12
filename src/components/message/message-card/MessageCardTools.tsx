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
import { Apps, CrossOriginMessage } from '../../../models/PostMessage';

const COPY_NOTIFICATION_TEXT = 'Text copied to the clipboard!';

const JSON_COPY_OPTIONS = ['body', 'fields'] as const;

export type MessageCardToolsConfig = {
	message: EventMessage;
	messageViewType: MessageViewType;
	toggleViewType: (viewType: MessageViewType) => void;
	isBookmarked: boolean;
	toggleMessagePin: () => void;
	isScreenshotMsg: boolean;
	isEmbedded?: boolean;
};

const MessageCardTools = ({
	message,
	messageViewType,
	toggleViewType,
	isBookmarked,
	toggleMessagePin,
	isScreenshotMsg,
	isEmbedded,
}: MessageCardToolsConfig) => {
	const { id, messageType } = message;

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
				MessageViewType.ASCII,
				MessageViewType.BINARY,
		  ]
		: [MessageViewType.BINARY, MessageViewType.ASCII];

	function onCopy() {
		let content: string;

		const jsonToCopy = message.body;

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

	const isRawViewType =
		messageViewType === MessageViewType.ASCII || messageViewType === MessageViewType.BINARY;

	return (
		<div className='message-card-tools' ref={rootRef}>
			<div
				className={createBemElement(
					'message-card-tools',
					'button',
					isViewMenuOpen ? 'active' : null,
				)}
				onClick={e => {
					e.stopPropagation();
					setIsViewMenuOpen(isOpen => !isOpen);
				}}>
				<div className='message-card-tools__ellipsis' />
			</div>
			<MessagePopup isOpen={isViewMenuOpen}>
				{!isEmbedded && (
					<div
						className='message-card-tools__controls-group'
						title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
						<div className='message-card-tools__item' onClick={() => toggleMessagePin()}>
							<div
								className={createBemElement(
									'message-card-tools',
									'icon',
									'bookmark',
									isBookmarked ? 'pinned' : null,
								)}
							/>
						</div>
					</div>
				)}
				{!isScreenshotMsg && (
					<div className='message-card-tools__controls-group'>
						{viewTypes.map(viewType => {
							const itemClassName = createBemElement(
								'message-card-tools',
								'item',
								viewType === messageViewType ? 'active' : null,
							);
							const iconClassName = createBemElement('message-card-tools', 'icon', viewType);

							return (
								<div
									title={viewType}
									className={itemClassName}
									key={viewType}
									onClick={() => toggleViewType(viewType)}>
									<div className={iconClassName} />
								</div>
							);
						})}
					</div>
				)}
				{!isScreenshotMsg && (
					<div className='message-card-tools__controls-group'>
						{isRawViewType ? (
							<div
								title='Copy content to clipboard'
								className='message-card-tools__item'
								onClick={() => onCopy()}>
								<span className='message-card-tools__item-title'>Copy</span>
								<div className='message-card-tools__copy-icon' />
								<div className={createBemElement('message-card-tools', 'indicator', 'bookmark')} />
							</div>
						) : (
							JSON_COPY_OPTIONS.map(copyOption => (
								<div
									key={copyOption}
									title='Copy content to clipboard'
									className='message-card-tools__item'
									onClick={() => {
										onCopy();
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
							))
						)}
					</div>
				)}
				{isScreenshotMsg && (
					<a
						className='message-card-tools__item'
						download={`${id}.${messageType.replace('image/', '')}`}
						href={`data:${message.messageType};base64,${message.bodyBase64 || ''}`}>
						<div className='message-card-tools__icon download' />
					</a>
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
											jsonBody:
												message.body &&
												JSON.stringify(normalizeFields(message.body?.fields), null, '    '),
										} as unknown,
										action: 'replayMessage',
										publisher: Apps.ReportViewer,
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
					onClick={e => e.stopPropagation()}
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

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
import { createBemBlock, createBemElement } from '../../../helpers/styleCreators';
import { EventMessage, MessageViewType } from '../../../models/EventMessage';
import { useOutsideClickListener } from '../../../hooks/useOutsideClickListener';
import { decodeBase64RawContent, getAllRawContent } from '../../../helpers/rawFormatter';
import { copyTextToClipboard } from '../../../helpers/copyHandler';
import { showNotification } from '../../../helpers/showNotification';
import { normalizeFields } from '../../../helpers/message';
import { MessageBodyPayload } from '../../../models/MessageBody';

const COPY_NOTIFICATION_TEXT = 'Text copied to the clipboard!';

export type MessageCardToolsConfig = {
	bodyItem: MessageBodyPayload;
	subsequenceId: number;
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
	bodyItem,
}: MessageCardToolsConfig) => {
	const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
	const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		setIsCopyMenuOpen(false);
	}, [messageViewType, isViewMenuOpen]);

	useOutsideClickListener(rootRef, (e: MouseEvent) => {
		if (e.target instanceof Element && rootRef.current && !rootRef.current.contains(e.target)) {
			setIsViewMenuOpen(false);
			setIsCopyMenuOpen(false);
		}
	});

	const bookmarkIconClass = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : null);

	const viewTypes = bodyItem
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
				? bodyItem.message.fields
					? normalizeFields(bodyItem.message.fields)
					: null
				: bodyItem;

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

		if (isCopyMenuOpen) {
			setIsCopyMenuOpen(false);
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
				{!isEmbedded && (
					<div
						className={bookmarkIconClass}
						title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
					/>
				)}
				<div className='message-card-tools__ellipsis' />
			</div>
			<MessagePopup isOpen={isViewMenuOpen}>
				{!isEmbedded && (
					<div className='message-card-tools__item' onClick={() => toggleMessagePin()}>
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
				)}
				{!isScreenshotMsg &&
					viewTypes.map(viewType => {
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
								<div className={iconClassName} />
								<div className={indicatorClassName} />
							</div>
						);
					})}
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
			</MessagePopup>
			{!isScreenshotMsg &&
				(messageViewType === MessageViewType.ASCII ||
					messageViewType === MessageViewType.BINARY) && (
					<div className='message-card-tools__copy-all' title='Copy content to clipboard'>
						<div className='message-card-tools__copy-icon' onClick={() => onCopy()} />
					</div>
				)}
			{!isScreenshotMsg &&
				(messageViewType === MessageViewType.JSON ||
					messageViewType === MessageViewType.FORMATTED) && (
					<div>
						<div
							className='message-card-tools__copy-all'
							title='Copy content to clipboard'
							onClick={() => setIsCopyMenuOpen(isOpen => !isOpen)}>
							<div className='message-card-tools__copy-icon' />
						</div>
						<MessagePopup isOpen={isCopyMenuOpen}>
							<div className='message-card-tools__item' onClick={() => onCopy()}>
								Copy full
							</div>
							<div className='message-card-tools__item' onClick={() => onCopy('fields')}>
								Copy simplified
							</div>
						</MessagePopup>
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

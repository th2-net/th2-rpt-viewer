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
import { useOutsideClickListener } from '../../../hooks';
import { decodeBase64RawContent, getAllRawContent } from '../../../helpers/rawFormatter';
import { copyTextToClipboard } from '../../../helpers/copyHandler';
import { showNotification } from '../../../helpers/showNotification';

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
}: MessageCardToolsConfig) => {
	const [showDropdown, toggleDropdown] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const dropDownRef = useRef<HTMLDivElement>(null);

	useOutsideClickListener(rootRef, (e: MouseEvent) => {
		if (e.target instanceof Element && rootRef.current && !rootRef.current.contains(e.target)) {
			toggleDropdown(false);
		}
	});

	const bookmarkIconClass = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : null);

	const viewTypes = message.body
		? [
				MessageViewType.JSON,
				MessageViewType.FORMATTED,
				MessageViewType.BINARY,
				MessageViewType.ASCII,
		  ]
		: [MessageViewType.BINARY, MessageViewType.ASCII];

	function onCopy() {
		let content: string;

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
				content = message.body ? JSON.stringify(message.body, null, 4) : '';
				break;
			case MessageViewType.JSON:
				content = message.body ? JSON.stringify(message.body) : '';
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
				className={createBemElement('message-card-tools', 'button', showDropdown ? 'active' : null)}
				onClick={() => toggleDropdown(isDropdownShown => !isDropdownShown)}>
				<div
					className={bookmarkIconClass}
					title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
				/>
				<div className='message-card-tools__ellipsis' />
			</div>
			<AnimatePresence>
				{showDropdown && (
					<motion.div
						className='message-card-tools__controls'
						ref={dropDownRef}
						style={{ transformOrigin: 'top' }}
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.5 }}
						transition={{ duration: 0.15, ease: 'easeOut' }}>
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
					</motion.div>
				)}
			</AnimatePresence>
			{!isScreenshotMsg && (
				<div className='message-card-tools__copy-all' title='Copy content to clipboard'>
					<div className='message-card-tools__copy-icon' onClick={onCopy} />
				</div>
			)}
		</div>
	);
};

export default MessageCardTools;

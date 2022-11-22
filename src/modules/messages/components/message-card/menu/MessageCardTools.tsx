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

import React, { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createBemElement } from 'helpers/styleCreators';
import { EventMessage, MessageViewType, ParsedMessage } from 'models/EventMessage';
import { useOutsideClickListener } from 'hooks/useOutsideClickListener';
import useViewMode from 'hooks/useViewMode';
import { ViewMode } from 'components/ViewModeProvider';
import { Chip } from 'components/Chip';
import { BookmarkIcon } from 'components/icons/BookmarkIcon';
import { isRawViewType, copyMessageContents } from '../../../helpers/message';
import { ViewTypeSelect } from './ViewTypeSelect';
import { ActUIButton } from './ActUIButton';

const JSON_COPY_OPTIONS = ['body', 'fields'] as const;

export type MessageCardToolsProps = {
	message: EventMessage;
	isBookmarked?: boolean;
	toggleMessagePin?: () => void;
};

type OwnProps = {
	viewType?: MessageViewType;
	setViewType?: (id: string, vt: MessageViewType) => void;
	parsedMessage?: ParsedMessage;
	isScreenshotMsg?: boolean;
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
	const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const viewMode = useViewMode();

	useOutsideClickListener(rootRef, (e: MouseEvent) => {
		if (e.target instanceof Element && rootRef.current && !rootRef.current.contains(e.target)) {
			setIsViewMenuOpen(false);
		}
	});

	const isRaw = viewType !== undefined && isRawViewType(viewType);

	const viewTypes =
		parsedMessage && !isRaw
			? [MessageViewType.JSON, MessageViewType.FORMATTED]
			: [MessageViewType.BINARY, MessageViewType.ASCII];

	const toggleViewType = useCallback(
		(v: MessageViewType) => {
			if (setViewType) {
				setViewType(parsedMessage && !isRaw ? parsedMessage.id : message.id, v);
			}
		},
		[parsedMessage, isRaw],
	);

	const toggleMenu = () => setIsViewMenuOpen(isOpen => !isOpen);

	const onCopy = (jsonObjectToCopy: 'body' | 'fields' = 'body') => {
		copyMessageContents(message, viewType, parsedMessage, jsonObjectToCopy);
	};

	const copyOptions = isRaw ? [JSON_COPY_OPTIONS[0]] : JSON_COPY_OPTIONS;

	const buttonClassName = createBemElement(
		'message-card-tools',
		'button',
		isViewMenuOpen ? 'active' : null,
	);

	return (
		<div className='message-card-tools' ref={rootRef}>
			<div
				className={buttonClassName}
				onClick={e => {
					e.stopPropagation();
					toggleMenu();
				}}>
				<div className='message-card-tools__ellipsis' />
			</div>
			<MessagePopup isOpen={isViewMenuOpen}>
				<div
					className='message-card-tools__header-close'
					onClick={() => setIsViewMenuOpen(false)}
				/>
				<ViewTypeSelect
					onViewTypeSelect={toggleViewType}
					viewTypes={viewTypes}
					selectedViewType={viewType}
				/>
				<p>Action</p>
				{viewMode !== ViewMode.EmbeddedMessages && toggleMessagePin && (
					<div className='message-card-tools__item' onClick={toggleMessagePin}>
						<Chip>
							<BookmarkIcon isPinned={Boolean(isBookmarked)} />
						</Chip>
						<span className='message-card-tools__item-title'>Bookmark</span>
					</div>
				)}
				{isScreenshotMsg ? (
					<DownloadImageButton message={message} parsedMessage={parsedMessage} />
				) : (
					<div>
						{copyOptions.map(option => (
							<CopyButton key={option} onCopy={onCopy} copyOption={option} isRaw={isRaw} />
						))}
					</div>
				)}
				{viewMode === ViewMode.EmbeddedMessages && (
					<div>
						{parsedMessage && (
							<ActUIButton parsedMessage={parsedMessage} message={message} closeMenu={toggleMenu} />
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

interface DownloadImageButtonProps {
	message: EventMessage;
	parsedMessage?: ParsedMessage;
}

function DownloadImageButton(props: DownloadImageButtonProps) {
	const { message, parsedMessage } = props;
	return (
		<div className='message-card-tools__item'>
			<a
				download={`${message.id}.${parsedMessage?.message.metadata.messageType.replace(
					'image/',
					'',
				)}`}
				href={`data:${parsedMessage?.message.metadata.messageType};base64,${
					message.rawMessageBase64 || ''
				}`}>
				<div className='message-card-tools__icon download' />
			</a>
			<span className='message-card-tools__item-title'>Download</span>
		</div>
	);
}

interface CopyButtonProps {
	onCopy: (copyOption?: 'body' | 'fields') => void;
	copyOption: 'body' | 'fields';
	isRaw: boolean;
}

function CopyButton(props: CopyButtonProps) {
	const { copyOption, isRaw, onCopy } = props;
	return (
		<div
			key={copyOption}
			title='Copy content to clipboard'
			className='message-card-tools__item'
			onClick={() => {
				onCopy(copyOption);
			}}>
			<div className='message-card-tools__copy-icon' />
			<span className='message-card-tools__item-title'>
				{isRaw ? 'Copy' : copyOption === 'body' ? 'Copy full' : 'Copy simplified'}
			</span>
		</div>
	);
}

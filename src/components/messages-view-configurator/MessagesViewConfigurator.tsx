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

import { observer } from 'mobx-react-lite';
import React, { useRef, useState } from 'react';
import { useOutsideClickListener, useUserDataStore } from '../../hooks';
import { ModalPortal } from '../util/Portal';
import '../../styles/messages-view-configurator.scss';
import RulesList from './RulesList';
import { createStyleSelector } from '../../helpers/styleCreators';
import BodySortConfig from './BodySortConfig';
import StringFilterRow from '../filter/row/StringRow';

type Props = {
	sessions: string[];
};

const MessageViewConfigurator = ({ sessions }: Props) => {
	const { user, setUserName, saveNewUser, isDefaultUser } = useUserDataStore();

	const [isOpen, setIsOpen] = useState(false);
	const [isEditingUserName, setIsEditingUserName] = useState(false);
	const [mode, setMode] = useState<'display-rules' | 'body-sort'>('display-rules');

	const modalRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		const isFromAutocomplete = Boolean((e.target as HTMLElement).closest('.rules-autocomplete'));
		const isFromSelect = Boolean((e.target as HTMLElement).closest('.rules-select-options-list'));
		if (e.target !== buttonRef.current && !isFromAutocomplete && !isFromSelect) {
			setIsOpen(false);
		}
	});

	const rulesButtonClassName = createStyleSelector(
		'switcher',
		mode === 'display-rules' ? 'active' : null,
	);
	const sortButtonClassName = createStyleSelector(
		'switcher',
		mode === 'body-sort' ? 'active' : null,
	);

	return (
		<>
			<button
				ref={buttonRef}
				className='messages-view-configurator-open'
				onClick={() => setIsOpen(open => !open)}
				title='Message display rules'
			/>
			<ModalPortal
				isOpen={isOpen}
				ref={modalRef}
				style={{
					position: 'absolute',
					width: '320px',
					top: '35px',
					right: '14px',
					zIndex: 500,
				}}>
				<div className='messages-view-configurator'>
					<div className='messages-view-configurator__user'>
						User name:
						{isEditingUserName ? (
							<>
								<StringFilterRow
									config={{
										type: 'string',
										id: 'user-name',
										value: user?.name || '',
										setValue: setUserName,
									}}
								/>
								<button
									className='edit-user-name'
									onClick={() => {
										saveNewUser();
										setIsEditingUserName(false);
									}}>
									ok
								</button>
							</>
						) : (
							<p onClick={() => setIsEditingUserName(true)} className='user-name'>
								{user?.name}
							</p>
						)}
					</div>
					{isDefaultUser && (
						<p className='hint'>
							<i>
								{`Feel free to play with preferences but you'll 
								have to change user name to make app save them`}
							</i>
						</p>
					)}
					<div className='messages-view-configurator-header'>
						<p>{mode === 'display-rules' ? 'Message Display Rules' : 'Message Body Sort'}</p>
					</div>
					<div className='messages-view-configurator-body'>
						{mode === 'display-rules' ? <RulesList sessions={sessions} /> : <BodySortConfig />}
					</div>
					{mode === 'display-rules' ? (
						<p className='hint'>
							<i>Use * character to match an unknown substring as part of session name</i>
						</p>
					) : null}
					<div className='switchers'>
						<button className={rulesButtonClassName} onClick={() => setMode('display-rules')}>
							Display rules
						</button>
						<button className={sortButtonClassName} onClick={() => setMode('body-sort')}>
							Body sort
						</button>
					</div>
				</div>
			</ModalPortal>
		</>
	);
};

export default observer(MessageViewConfigurator);

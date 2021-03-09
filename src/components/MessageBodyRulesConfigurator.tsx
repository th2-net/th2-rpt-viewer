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
import { useActiveWorkspace, useOutsideClickListener } from '../hooks';
import { MessageDisplayRule, MessageViewType } from '../models/EventMessage';
import '../styles/message-body-rules.scss';
import AutocompleteInput from './util/AutocompleteInput';
import { ModalPortal } from './util/Portal';
import Select from './util/Select';

const MessageBodyRulesConfigurator = () => {
	const activeWorkspace = useActiveWorkspace();
	const [isOpen, setIsOpen] = useState(false);
	const [currentSessionValue, setSessionValue] = useState('');
	const [currentSelected, setCurrentSelected] = useState(MessageViewType.JSON);
	const modalRef = useRef(null);
	const sessionInputRef = useRef(null);
	useOutsideClickListener(modalRef, () => {
		setIsOpen(false);
	});

	return (
		<>
			<button className='message-display-rules-open' onClick={() => setIsOpen(open => !open)}>
				Message display rules
			</button>
			<ModalPortal
				isOpen={isOpen}
				ref={modalRef}
				style={{
					position: 'absolute',
					width: '40%',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					zIndex: 500,
				}}>
				<div className='message-display-rules'>
					<div className='message-display-rules-header'>
						<p>Message Display Rules</p>
						<button onClick={() => setIsOpen(false)}>&#215;</button>
					</div>
					<div className='message-display-rules-body'>
						{activeWorkspace.messageDisplayRules.map((rule: MessageDisplayRule, i: number) => {
							return (
								<div className='rule' key={i}>
									<p className='rule__session'>{rule.session}</p>
									<p className='rule__type'>{rule.viewType}</p>
									{rule.removable && (
										<button
											className='rule__delete'
											onClick={() => {
												activeWorkspace.deleteMessagesDisplayRule(rule);
											}}>
											&#215;
										</button>
									)}
								</div>
							);
						})}
					</div>
					<div className='message-display-rules-inputs'>
						<div className='session'>
							<p>Session</p>
							<AutocompleteInput
								autoresize={false}
								className='session__input'
								ref={sessionInputRef}
								value={currentSessionValue}
								onSubmit={v => {
									setSessionValue(v);
								}}
								notResetOnSubmit
								autocomplete={activeWorkspace.messagesStore.messageSessions}
								datalistKey='session-input'
							/>
						</div>
						<div className='view-type'>
							<Select
								options={[
									MessageViewType.JSON,
									MessageViewType.FORMATTED,
									MessageViewType.ASCII,
									MessageViewType.BINARY,
								]}
								selected={currentSelected}
								onChange={(v: MessageViewType) => setCurrentSelected(v)}
							/>
						</div>
					</div>
					<div className='message-display-rules-buttons'>
						<button
							disabled={!currentSessionValue}
							onClick={() => {
								activeWorkspace.setNewMessagesDisplayRule({
									session: currentSessionValue,
									viewType: currentSelected,
									removable: true,
									editable: true,
								});
							}}>
							Add Rule
						</button>
					</div>
				</div>
			</ModalPortal>
		</>
	);
};

export default observer(MessageBodyRulesConfigurator);

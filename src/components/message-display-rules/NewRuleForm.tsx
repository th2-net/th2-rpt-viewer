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

import React, { useCallback, useRef, useState } from 'react';
import { useActiveWorkspace } from '../../hooks';
import { MessageDisplayRule, MessageViewType } from '../../models/EventMessage';
import AutocompleteInput from '../util/AutocompleteInput';
import Select from '../util/Select';

type NewRuleFormProps = {
	className: string;
	rule?: MessageDisplayRule;
	stopEdit?: () => void;
};

const NewRuleForm = ({ rule, className, stopEdit }: NewRuleFormProps) => {
	const inputsClassName = `${className}-inputs`;
	const buttonsClassName = `${className}-buttons`;
	const activeWorkspace = useActiveWorkspace();
	const [currentSessionValue, setSessionValue] = useState(rule ? rule.session : '');
	const [currentSelected, setCurrentSelected] = useState(
		rule ? rule.viewType : MessageViewType.JSON,
	);
	const sessionInputRef = useRef(null);
	const submitHandler = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (stopEdit) {
				stopEdit();
			}
			if (!rule) {
				const newRule = {
					session: currentSessionValue,
					viewType: currentSelected,
					removable: true,
					fullyEditable: true,
				};
				activeWorkspace.setNewMessagesDisplayRule(newRule);
				return;
			}
			const isSame =
				rule && rule.session === currentSessionValue && rule.viewType === currentSelected;
			if (!isSame) {
				const newRule = {
					session: currentSessionValue,
					viewType: currentSelected,
					removable: rule.removable,
					fullyEditable: rule.fullyEditable,
				};
				activeWorkspace.editMessageDisplayRule(rule, newRule);
			}
		},
		[rule, currentSessionValue, currentSelected, stopEdit],
	);
	return (
		<>
			<div className={inputsClassName}>
				<div className='session'>
					{!rule || rule.fullyEditable ? (
						<AutocompleteInput
							autoresize={false}
							placeholder='Session'
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
					) : (
						<p>{rule.session}</p>
					)}
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
			<div className={buttonsClassName}>
				<button disabled={!currentSessionValue} onClick={submitHandler}>
					{rule ? 'Edit Rule' : 'Add Rule'}
				</button>
			</div>
		</>
	);
};

export default NewRuleForm;

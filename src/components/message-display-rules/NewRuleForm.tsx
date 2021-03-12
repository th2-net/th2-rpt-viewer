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

import React, { useRef, useState } from 'react';
import { useMessageDisplayRulesStore } from '../../hooks';
import { MessageDisplayRule, MessageViewType } from '../../models/EventMessage';
import AutocompleteInput from '../util/AutocompleteInput';
import Select from '../util/Select';

type NewRuleFormProps = {
	sessions: string[];
	rule?: MessageDisplayRule | null;
	stopEdit?: () => void;
};

const NewRuleForm = ({ rule, stopEdit, sessions }: NewRuleFormProps) => {
	const rulesStore = useMessageDisplayRulesStore();
	const [currentSessionValue, setSessionValue] = useState(rule ? rule.session : '');
	const [currentSelected, setCurrentSelected] = useState(
		rule ? rule.viewType : MessageViewType.JSON,
	);
	const sessionInputRef = useRef(null);
	const submitHandler = (e: React.MouseEvent) => {
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
			rulesStore.setNewMessagesDisplayRule(newRule);
			setSessionValue('');
			return;
		}
		const isSame =
			rule && rule.session === currentSessionValue && rule.viewType === currentSelected;
		if (rule.session === '*') {
			rulesStore.setRootDisplayRule({
				...rule,
				viewType: currentSelected,
			});
			return;
		}
		if (!isSame) {
			const newRule = {
				session: currentSessionValue,
				viewType: currentSelected,
				removable: rule.removable,
				fullyEditable: rule.fullyEditable,
			};
			rulesStore.editMessageDisplayRule(rule, newRule);
		}
	};

	return (
		<div className='rule-inputs'>
			<div className='inputs-wrapper'>
				<div className='session'>
					{!rule || rule.fullyEditable ? (
						<AutocompleteInput
							autoresize={false}
							placeholder='New session'
							className='session-input'
							ref={sessionInputRef}
							value={currentSessionValue}
							onSubmit={v => {
								if (v === '*') {
									setSessionValue('');
									return;
								}
								setSessionValue(v);
							}}
							notResetOnSubmit
							autocomplete={sessions}
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
			<button
				className='rule-button'
				disabled={!currentSessionValue}
				onClick={submitHandler}
				title='submit'
			/>
		</div>
	);
};

export default NewRuleForm;

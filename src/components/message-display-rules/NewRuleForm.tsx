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

import { nanoid } from 'nanoid';
import React from 'react';
import { useMessageDisplayRulesStore } from '../../hooks';
import { MessageDisplayRule, MessageViewType } from '../../models/EventMessage';
import AutocompleteInput from '../util/AutocompleteInput';
import Select from '../util/Select';

type NewRuleFormProps = {
	sessions: string[];
	rule?: MessageDisplayRule | null;
	stopEdit?: () => void;
};

const viewTypes = Object.values(MessageViewType);

const NewRuleForm = ({ rule, stopEdit, sessions }: NewRuleFormProps) => {
	const rulesStore = useMessageDisplayRulesStore();

	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const [autocompleteAnchor, setAutocompleteAnchor] = React.useState<HTMLDivElement>();
	const [currentSessionValue, setSessionValue] = React.useState(rule ? rule.session : '');
	const [currentSelectedViewType, setCurrentSelectedViewType] = React.useState(
		rule ? rule.viewType : MessageViewType.JSON,
	);

	React.useEffect(() => {
		setSessionValue(rule ? rule.session : '');
		return () => {
			setSessionValue('');
		};
	}, [rule]);

	React.useLayoutEffect(() => {
		setAutocompleteAnchor(wrapperRef.current || undefined);
	}, [setAutocompleteAnchor]);

	const submitHandler = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (stopEdit) {
			stopEdit();
		}
		if (!rule) {
			if (!currentSessionValue) {
				return;
			}
			const newRule = {
				id: nanoid(),
				session: currentSessionValue,
				viewType: currentSelectedViewType,
				removable: true,
				fullyEditable: true,
			};
			rulesStore.setNewMessagesDisplayRule(newRule);
			setSessionValue('');
			return;
		}
		const isSame =
			rule && rule.session === currentSessionValue && rule.viewType === currentSelectedViewType;
		if (rule.session === '*') {
			rulesStore.setRootDisplayRule({
				...rule,
				viewType: currentSelectedViewType,
			});
			return;
		}
		if (!isSame) {
			const newRule = {
				id: rule.id,
				session: currentSessionValue,
				viewType: currentSelectedViewType,
				removable: rule.removable,
				fullyEditable: rule.fullyEditable,
			};
			rulesStore.editMessageDisplayRule(rule, newRule);
		}
	};

	return (
		<div className='rule-inputs'>
			<div className='inputs-wrapper' ref={wrapperRef}>
				<div className='session'>
					{!rule || rule.fullyEditable ? (
						<AutocompleteInput
							autoresize={false}
							anchor={autocompleteAnchor}
							placeholder='New session'
							className='session-input'
							value={currentSessionValue}
							setValue={setSessionValue}
							onSubmit={setSessionValue}
							autocomplete={sessions}
							autocompleteClassName='message-display-rules-autocomplete'
						/>
					) : (
						<p>{rule.session}</p>
					)}
				</div>
				<div className='view-type'>
					<Select
						options={viewTypes}
						selected={currentSelectedViewType}
						onChange={(v: MessageViewType) => setCurrentSelectedViewType(v)}
					/>
				</div>
			</div>
			<button className='rule-button' onClick={submitHandler} title='submit' />
		</div>
	);
};

export default NewRuleForm;

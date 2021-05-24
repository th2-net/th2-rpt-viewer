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

import React, { useState, useCallback } from 'react';
import { useMessageDisplayRulesStore } from '../../hooks';
import { MessageDisplayRule, MessageViewType } from '../../models/EventMessage';
import SessionEditor from './SessionEditor';
import RuleEditor from './RuleEditor';
import Reorder from './Reorder';

type EditableRuleProps = {
	rule: MessageDisplayRule;
	sessions: string[];
	index: number;
	isFirst?: boolean;
	isLast?: boolean;
	autofocus?: boolean;
};

const EditableRule = ({ sessions, rule, isFirst, isLast, index, autofocus }: EditableRuleProps) => {
	const rulesStore = useMessageDisplayRulesStore();

	return (
		<div className='rule editable'>
			<Reorder
				isFirst={isFirst}
				isLast={isLast}
				index={index}
				move={rulesStore.reorderMessagesDisplayRule}
			/>
			<Session rule={rule} sessions={sessions} autofocus={autofocus} />
			<ViewType rule={rule} />
			<Delete rule={rule} />
		</div>
	);
};

export default EditableRule;

interface SessionProps {
	rule: MessageDisplayRule;
	sessions: string[];
	autofocus?: boolean;
}

const Session = ({ rule, sessions, autofocus }: SessionProps) => {
	const rulesStore = useMessageDisplayRulesStore();

	const [value, setValue] = useState(rule.session);
	const [isEditing, setIsEditing] = useState(false);

	const editRuleSession = useCallback(() => {
		rulesStore.editMessageDisplayRule(rule, { ...rule, value });
		setIsEditing(false);
	}, [value]);

	return isEditing && rule.editableSession ? (
		<SessionEditor
			value={value}
			setValue={setValue}
			sessions={sessions}
			onSubmit={editRuleSession}
			autofocus={autofocus}
		/>
	) : (
		<p
			onClick={() => {
				setIsEditing(true);
			}}
			className={value === '*' ? 'root-rule' : ''}>
			{value === '*' ? (
				<>
					{value} <i>(default)</i>
				</>
			) : (
				value
			)}
		</p>
	);
};

const ViewType = ({ rule }: { rule: MessageDisplayRule }) => {
	const rulesStore = useMessageDisplayRulesStore();

	const [viewType, setViewType] = useState<MessageViewType>(rule.viewType);
	const [ruleIsEditing, setRuleIsEditing] = useState(false);

	const editViewType = (vType: MessageViewType) => {
		const newRule = { ...rule, viewType: vType };
		if (rule.session === '*') {
			rulesStore.setRootDisplayRule(newRule);
			setRuleIsEditing(false);
			return;
		}
		rulesStore.editMessageDisplayRule(rule, newRule);
		setRuleIsEditing(false);
	};

	return ruleIsEditing && rule.editableType ? (
		<RuleEditor
			selected={viewType}
			setSelected={setViewType}
			onSelect={editViewType}
			defaultOpen={true}
		/>
	) : (
		<p
			className={`view-type ${viewType.toLowerCase()}`}
			onClick={() => {
				setRuleIsEditing(true);
			}}
			title={viewType}
		/>
	);
};

const Delete = ({ rule }: { rule: MessageDisplayRule }) => {
	const rulesStore = useMessageDisplayRulesStore();

	const deleteHandler = () => {
		rulesStore.deleteMessagesDisplayRule(rule);
	};
	if (!rule.removable) {
		return null;
	}
	return <button className='rule-delete' onClick={deleteHandler} title='delete' />;
};

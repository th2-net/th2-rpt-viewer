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
	isFirst: boolean | null;
	isLast: boolean | null;
	autofocus?: boolean;
};

const EditableRule = ({ sessions, rule, isFirst, isLast, index, autofocus }: EditableRuleProps) => {
	const rulesStore = useMessageDisplayRulesStore();
	const [session, setSession] = useState(rule.session);
	const [viewType, setViewType] = useState<MessageViewType>(rule.viewType);
	const [sessionIsEditing, setSessionIsEditing] = useState(false);
	const [ruleIsEditing, setRuleIsEditing] = useState(false);

	const deleteHandler = () => {
		rulesStore.deleteMessagesDisplayRule(rule);
	};

	const editRuleSession = useCallback(() => {
		rulesStore.editMessageDisplayRule(rule, { ...rule, session });
		setSessionIsEditing(false);
	}, [session]);

	const editViewType = (vType: MessageViewType) => {
		const newRule = { ...rule, viewType: vType };
		if (rule.session === '*') {
			rulesStore.setRootDisplayRule(newRule);
		}
		rulesStore.editMessageDisplayRule(rule, newRule);
		setRuleIsEditing(false);
	};

	const renderSession = () => {
		return sessionIsEditing && rule.editableSession ? (
			<SessionEditor
				value={session}
				setValue={setSession}
				sessions={sessions}
				onSubmit={editRuleSession}
				autofocus={autofocus}
			/>
		) : (
			<p
				onClick={() => {
					setSessionIsEditing(true);
				}}
				className={session === '*' ? 'root-rule' : ''}>
				{session === '*' ? (
					<>
						{session} <i>(default)</i>
					</>
				) : (
					session
				)}
			</p>
		);
	};

	const renderViewType = () => {
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

	return (
		<>
			<Reorder
				isFirst={isFirst}
				isLast={isLast}
				index={index}
				move={rulesStore.reorderMessagesDisplayRule}
			/>
			{renderSession()}
			{renderViewType()}
			{rule.removable && (
				<button className='rule-delete' onClick={deleteHandler} title='delete'></button>
			)}
		</>
	);
};

export default EditableRule;

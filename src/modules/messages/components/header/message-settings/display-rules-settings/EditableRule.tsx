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

import clsx from 'clsx';
import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { usePrevious } from 'hooks/usePrevious';
import { MessageDisplayRule, MessageViewType } from 'models/EventMessage';
import { Chip } from 'components/Chip';
import { CrossIcon } from 'components/icons/CrossIcon';
import { ArrowIcon } from 'components/icons/ArrowIcon';
import { viewTypeIcons } from '../../../message-card/ViewTypesList';
import { useMessageDisplayRulesStore } from '../../../../hooks/useMessageDisplayRulesStore';
import SessionEditor from './SessionEditor';
import RuleEditor from './RuleEditor';

type EditableRuleProps = {
	rule: MessageDisplayRule;
	sessions: string[];
	index: number;
	isFirst?: boolean;
	isLast?: boolean;
	autofocus?: boolean;
};

const EditableRule = observer(
	({ sessions, rule, isFirst, isLast, index, autofocus }: EditableRuleProps) => {
		const rulesStore = useMessageDisplayRulesStore();

		return (
			<div className='rule-row editable'>
				<Reorder
					isFirst={isFirst}
					isLast={isLast}
					index={index}
					move={rulesStore.reorderMessagesDisplayRule}
				/>
				<Session rule={rule} sessions={sessions} autofocus={autofocus} />
				<ViewType rule={rule} />
				{rule.removable && (
					<button
						className='settings-button rule-delete'
						onClick={() => {
							rulesStore.deleteMessagesDisplayRule(rule);
						}}
						title='delete'>
						<CrossIcon />
					</button>
				)}
			</div>
		);
	},
);

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

	const isEditingPrev = usePrevious(isEditing);

	React.useEffect(() => {
		if (!isEditing && isEditingPrev && value !== rule.session) {
			rulesStore.editMessageDisplayRule(rule, { ...rule, session: value });
		}
	}, [isEditing, isEditingPrev, value]);

	const editRuleSession = useCallback(() => {
		setIsEditing(false);
	}, []);

	const isRootRule = value === '*';

	return isEditing && rule.editableSession ? (
		<SessionEditor
			value={value}
			setValue={setValue}
			sessions={sessions}
			onSubmit={editRuleSession}
			autofocus={autofocus}
		/>
	) : (
		<Chip
			onClick={() => setIsEditing(true)}
			className={clsx('session', { 'root-rule': isRootRule })}>
			{value} {isRootRule && <i>(default)</i>}
		</Chip>
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

	const Icon = viewTypeIcons[viewType];

	return ruleIsEditing && rule.editableType ? (
		<RuleEditor
			selected={viewType}
			setSelected={setViewType}
			onSelect={editViewType}
			defaultOpen={true}
		/>
	) : (
		<button className='settings-button' onClick={() => setRuleIsEditing(true)} title={viewType}>
			<Icon />
		</button>
	);
};

interface ReorderProps {
	isFirst?: boolean;
	isLast?: boolean;
	index: number;
	move: (from: number, to: number) => void;
}

export function Reorder({ isFirst, isLast, index, move }: ReorderProps) {
	if ((isFirst === undefined && isLast === undefined) || (isFirst && isLast)) return null;
	return (
		<div className='reorder'>
			{!isFirst && (
				<button
					className='settings-button reorder__up'
					onClick={(e: React.MouseEvent) => {
						e.stopPropagation();
						move(index, index - 1);
					}}>
					<ArrowIcon />
				</button>
			)}
			{!isLast && (
				<button
					className='reorder__down settings-button'
					onClick={(e: React.MouseEvent) => {
						e.stopPropagation();
						move(index, index + 1);
					}}>
					<ArrowIcon />
				</button>
			)}
		</div>
	);
}

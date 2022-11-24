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
import { observer } from 'mobx-react-lite';
import { MessageDisplayRule, MessageViewType } from 'models/EventMessage';
import moment from 'moment';
import React, { useState } from 'react';
import { useMessageDisplayRulesStore } from '../../../../hooks/useMessageDisplayRulesStore';
import SessionEditor from './SessionEditor';
import RuleEditor from './RuleEditor';
import EditableRule from './EditableRule';

interface RuleRowProps {
	rule: MessageDisplayRule | null;
	sessions: string[];
	index: number;
	isFirst?: boolean;
	isLast?: boolean;
	autofocus?: boolean;
}

const RuleRow = (props: RuleRowProps) => {
	const { rule, sessions, ...restProps } = props;
	return rule ? (
		<EditableRule rule={rule} sessions={sessions} {...restProps} />
	) : (
		<NewRule sessions={sessions} />
	);
};

export default RuleRow;

type NewRuleProps = {
	sessions: string[];
};

const NewRule = observer(({ sessions }: NewRuleProps) => {
	const rulesStore = useMessageDisplayRulesStore();

	const [session, setSession] = useState('');
	const [viewType, setViewType] = useState(MessageViewType.JSON);

	const submitHandler = (e: React.MouseEvent) => {
		e.stopPropagation();
		rulesStore.setNewMessagesDisplayRule({
			id: nanoid(),
			session,
			viewType,
			removable: true,
			editableSession: true,
			editableType: true,
			timestamp: moment.utc().valueOf(),
		});
	};

	return (
		<div className='rule-row'>
			<SessionEditor value={session} setValue={setSession} sessions={sessions} />
			<RuleEditor selected={viewType} setSelected={setViewType} />
			<button
				className='settings-button'
				onClick={submitHandler}
				title='Add rule'
				disabled={!session.trim()}>
				+
			</button>
		</div>
	);
});

NewRule.displayName = 'NewRuleRow';

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
import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useMessageDisplayRulesStore } from '../../hooks';
import RuleRow from './RuleRow';

interface Props {
	sessions: string[];
}

const RulesList = ({ sessions }: Props) => {
	const rulesStore = useMessageDisplayRulesStore();

	const computeKey = (index: number) => {
		const rule = rulesStore.messageDisplayRules[index];
		return rule.id;
	};

	const renderRule = (index: number) => {
		const rule = rulesStore.messageDisplayRules[index];
		return (
			<RuleRow
				sessions={sessions}
				rule={rule}
				key={rule.id}
				index={index}
				isFirst={index === 0}
				isLast={index === rulesStore.messageDisplayRules.length - 1}
				autofocus={true}
			/>
		);
	};

	return (
		<>
			<div className='messages-view-configurator-body__header'>
				<p>Session</p>
				<p>Display Mode</p>
			</div>
			<Virtuoso
				className='rules'
				itemContent={renderRule}
				computeItemKey={computeKey}
				totalCount={rulesStore.messageDisplayRules.length}
				style={{ height: '120px' }}
				components={{
					Header: function Header() {
						return <RuleRow rule={null} sessions={sessions} index={0} />;
					},
					Footer: function Footer() {
						return <RuleRow sessions={sessions} rule={rulesStore.rootDisplayRule} index={0} />;
					},
				}}
			/>
		</>
	);
};

export default observer(RulesList);

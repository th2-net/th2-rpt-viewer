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
import { MessageDisplayRule } from 'models/EventMessage';
import { Virtuoso } from 'react-virtuoso';
import { useMessagesFilterConfigStore } from '../../../../hooks/useFilterConfigStore';
import { useMessageDisplayRulesStore } from '../../../../hooks/useMessageDisplayRulesStore';
import RuleRow from './RuleRow';

const computeKey = (index: number, rule: MessageDisplayRule) => rule.id;

export const DisplayRules = observer(() => {
	const { messageSessions } = useMessagesFilterConfigStore();

	const rulesStore = useMessageDisplayRulesStore();

	const renderRule = (index: number, rule: MessageDisplayRule) => (
		<RuleRow
			sessions={messageSessions}
			rule={rule}
			key={rule.id}
			index={index}
			isFirst={index === 0}
			isLast={index === rulesStore.messageDisplayRules.length - 1}
			autofocus={true}
		/>
	);

	return (
		<div className='display-rules'>
			<p className='display-rules__header'>Display Rules</p>
			<div className='display-rules__columns'>
				<p>Session</p>
				<p>Display Mode</p>
			</div>
			<Virtuoso
				className='display-rules__list'
				itemContent={renderRule}
				computeItemKey={computeKey}
				data={rulesStore.messageDisplayRules}
				components={{
					Header: function Header() {
						return <RuleRow rule={null} sessions={messageSessions} index={0} />;
					},
					Footer: function Footer() {
						return (
							<RuleRow sessions={messageSessions} rule={rulesStore.rootDisplayRule} index={0} />
						);
					},
				}}
			/>
			<p className='display-rules__hint'>
				Use * character to match an unknown substring as part of session name
			</p>
		</div>
	);
});

DisplayRules.displayName = 'DisplayRules';

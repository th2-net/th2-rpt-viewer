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

import * as React from 'react';
import { MessageDisplayRule } from '../../models/EventMessage';
import NewRule from './NewRule';
import { createStyleSelector } from '../../helpers/styleCreators';
import EditableRule from './EditableRule';

interface RuleRowProps {
	rule: MessageDisplayRule | null;
	sessions: string[];
	index: number;
	isFirst: boolean | null;
	isLast: boolean | null;
	autofocus?: boolean;
}

const RuleRow: React.FC<RuleRowProps> = props => {
	const { rule, sessions, ...restProps } = props;
	const ruleClassName = createStyleSelector('rule', rule ? 'editable' : null);
	const renderRow = () => {
		if (rule) {
			return <EditableRule rule={rule} sessions={sessions} {...restProps} />;
		}
		return <NewRule sessions={sessions} />;
	};
	return <div className={ruleClassName}>{renderRow()}</div>;
};

export default RuleRow;

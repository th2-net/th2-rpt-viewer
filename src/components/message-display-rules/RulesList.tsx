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
import { MessageDisplayRule } from '../../models/EventMessage';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';
import DisplayRule from './DisplayRule';

type Props = {
	activeWorkspace: WorkspaceStore;
}

const RulesList = ({ activeWorkspace }: Props) => {
	return (
		<div className='message-display-rules-body'>
			<div className='message-display-rules-body__header'>
				<p>Session</p>
				<p>Display Rule</p>
			</div>
			{activeWorkspace.messageDisplayRules.map((rule: MessageDisplayRule, i: number) => (
				<DisplayRule activeWorkspace={activeWorkspace} rule={rule} key={i} />
			))}
		</div>
	);
};

export default observer(RulesList);

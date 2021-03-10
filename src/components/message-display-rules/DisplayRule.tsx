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
import { useOutsideClickListener } from '../../hooks';
import { MessageDisplayRule } from '../../models/EventMessage';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';
import NewRuleForm from './NewRuleForm';

type DisplayRuleProps = {
	rule: MessageDisplayRule;
	activeWorkspace: WorkspaceStore;
};

const DisplayRuleRenderer = ({ rule, activeWorkspace }: DisplayRuleProps) => {
	return (
		<>
			<p className='rule__session'>{rule.session}</p>
			<p className='rule__type'>{rule.viewType}</p>
			{rule.removable && (
				<button
					className='rule__delete'
					title='delete rule'
					onClick={() => {
						activeWorkspace.deleteMessagesDisplayRule(rule);
					}}>
					&#215;
				</button>
			)}
		</>
	);
};

const DisplayRule = ({ rule, activeWorkspace }: DisplayRuleProps) => {
	const [startEdit, setStartEdit] = useState(false);
	const ruleRef = useRef(null);
	useOutsideClickListener(ruleRef, () => {
		setStartEdit(false);
	});

	return (
		<div
			className={startEdit ? 'rule-editor' : 'rule'}
			ref={ruleRef}
			onClick={() => {
				setStartEdit(true);
			}}>
			{startEdit ? (
				<NewRuleForm
					activeWorkspace={activeWorkspace}
					rule={rule}
					className='rule-editor'
					stopEdit={() => {
						setStartEdit(false);
					}}
				/>
			) : (
				<DisplayRuleRenderer rule={rule} activeWorkspace={activeWorkspace} />
			)}
		</div>
	);
};

export default DisplayRule;

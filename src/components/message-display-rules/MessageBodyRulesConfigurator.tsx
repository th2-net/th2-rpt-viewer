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
import { ModalPortal } from '../util/Portal';
import '../../styles/message-body-rules.scss';
import RulesList from './RulesList';
import NewRuleForm from './NewRuleForm';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';

type Props = {
	activeWorkspace: WorkspaceStore
}

const MessageBodyRulesConfigurator = ({activeWorkspace}: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const modalRef = useRef(null);
	useOutsideClickListener(modalRef, () => {
		setIsOpen(false);
	});

	return (
		<>
			<button className='message-display-rules-open' onClick={() => setIsOpen(open => !open)} />
			<ModalPortal
				isOpen={isOpen}
				ref={modalRef}
				style={{
					position: 'absolute',
					width: '40%',
					top: '35px',
					right: '14px',
					zIndex: 500,
				}}>
				<div className='message-display-rules'>
					<div className='message-display-rules-header'>
						<p>Message Display Rules</p>
						<button onClick={() => setIsOpen(false)}>&#215;</button>
					</div>
					<RulesList activeWorkspace={activeWorkspace}/>
					<NewRuleForm
						activeWorkspace={activeWorkspace}
						className='message-display-rules'
					/>
				</div>
			</ModalPortal>
		</>
	);
};

export default MessageBodyRulesConfigurator;

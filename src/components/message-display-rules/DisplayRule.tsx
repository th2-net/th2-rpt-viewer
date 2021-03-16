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
import { createStyleSelector } from '../../helpers/styleCreators';
import { useMessageDisplayRulesStore, useOutsideClickListener } from '../../hooks';
import { MessageDisplayRule } from '../../models/EventMessage';
import NewRuleForm from './NewRuleForm';

interface DisplayRuleProps {
	rule: MessageDisplayRule | null;
	sessions: string[];
	index: number;
	isFirst: boolean | null;
	isLast: boolean | null;
}

interface DisplayRuleRendererProps {
	rule: MessageDisplayRule | null;
	isFirst: boolean | null;
	isLast: boolean | null;
	index: number;
}

const DisplayRuleRenderer = ({ rule, isFirst, isLast, index }: DisplayRuleRendererProps) => {
	const rulesStore = useMessageDisplayRulesStore();
	if (!rule) {
		return null;
	}
	const renderReorder = () => {
		if ((isFirst === null && isLast === null) || (isFirst && isLast)) return null;
		return (
			<div className='reorder'>
				{!isFirst && (
					<button
						className='reorder-control up'
						onClick={() => {
							rulesStore.reorderMessagesDisplayRule(index, index - 1);
						}}
					/>
				)}
				{!isLast && (
					<button
						className='reorder-control down'
						onClick={() => {
							rulesStore.reorderMessagesDisplayRule(index, index + 1);
						}}
					/>
				)}
			</div>
		);
	};
	return (
		<>
			{renderReorder()}
			<p className='rule-session'>{rule.session}</p>
			<span className='rule-filler'></span>
			<p className='rule-type'>{rule.viewType}</p>
			{rule.removable && (
				<button
					className='rule-delete'
					title='delete'
					onClick={() => {
						rulesStore.deleteMessagesDisplayRule(rule);
					}}
				/>
			)}
		</>
	);
};

const DisplayRule = ({ rule, isFirst, isLast, sessions, index }: DisplayRuleProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const className = createStyleSelector(
		'rule',
		isEditing ? 'editing' : null,
		rule && !rule.fullyEditable ? 'full' : null,
	);
	const ruleRef = useRef(null);
	useOutsideClickListener(ruleRef, () => {
		setIsEditing(false);
	});

	return (
		<div
			className={className}
			ref={ruleRef}
			onDoubleClick={() => {
				setIsEditing(true);
			}}>
			{isEditing ? (
				<NewRuleForm
					sessions={sessions}
					rule={rule}
					stopEdit={() => {
						setIsEditing(false);
					}}
				/>
			) : (
				<DisplayRuleRenderer rule={rule} isFirst={isFirst} isLast={isLast} index={index} />
			)}
		</div>
	);
};

export default DisplayRule;

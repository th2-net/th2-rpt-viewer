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

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createStyleSelector } from '../../helpers/styleCreators';
import { useMessageDisplayRulesStore, useOutsideClickListener } from '../../hooks';
import { MessageDisplayRule } from '../../models/EventMessage';
import { Position } from './RulesList';
import NewRuleForm from './NewRuleForm';

type DisplayRuleProps = {
	rule: MessageDisplayRule | null;
	sessions: string[];
};

const DisplayRuleRenderer = ({ rule }: { rule: MessageDisplayRule | null }) => {
	const rulesStore = useMessageDisplayRulesStore();
	if (!rule) {
		return null;
	}
	return (
		<>
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

const DisplayRule = ({ rule, sessions }: DisplayRuleProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const className = createStyleSelector('rule', isEditing ? 'editing' : null);
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
				<DisplayRuleRenderer rule={rule} />
			)}
		</div>
	);
};

export default DisplayRule;

interface DraggableDisplayRuleProps extends DisplayRuleProps {
	index: number;
	updatePosition: (i: number, offset: Position) => void;
	updateOrder: (i: number, dragOffset: number) => void;
}

export const DraggableDisplayRule = (props: DraggableDisplayRuleProps) => {
	const { rule, sessions, index, updatePosition, updateOrder } = props;
	const [isDragging, setDragging] = useState(false);

	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (ref.current) {
			updatePosition(index, {
				height: ref.current.offsetHeight,
				top: ref.current.offsetTop,
			});
		}
	});

	return (
		<motion.div
			ref={ref}
			layout
			initial={false}
			style={{
				position: 'relative',
				background: 'white',
				padding: 0,
				zIndex: isDragging ? 2 : 1,
			}}
			whileHover={{
				scale: 1.01,
				boxShadow: '0px 3px 3px rgba(0,0,0,0.15)',
			}}
			whileTap={{
				scale: 1.03,
				boxShadow: '0px 5px 5px rgba(0,0,0,0.1)',
			}}
			drag='y'
			onDragStart={() => setDragging(true)}
			onDragEnd={() => setDragging(false)}
			onViewportBoxUpdate={(_viewportBox, delta) => {
				if (isDragging) {
					updateOrder(index, delta.y.translate);
				}
			}}>
			<DisplayRule rule={rule} sessions={sessions} />
		</motion.div>
	);
};

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
import React, { useRef } from 'react';
import { clamp } from '../../helpers/number';
import { useMessageDisplayRulesStore } from '../../hooks';
import { MessageDisplayRule } from '../../models/EventMessage';
import DisplayRule, { DraggableDisplayRule } from './DisplayRule';

type Props = {
	sessions: string[];
};

export type Position = {
	top: number;
	height: number;
};

const RulesList = ({ sessions }: Props) => {
	const rulesStore = useMessageDisplayRulesStore();
	const positions = useRef<Position[]>([]).current;
	const updatePosition = (i: number, offset: Position) => {
		positions[i] = offset;
	};
	const updateOrder = (i: number, dragOffset: number) => {
		const targetIndex = findIndex(i, dragOffset, positions);
		if (targetIndex !== i) rulesStore.reorderMessagesDisplayRule(i, targetIndex);
	};
	return (
		<div className='message-display-rules-body'>
			<div className='message-display-rules-body__header'>
				<p>Session</p>
				<p>Display Rule</p>
			</div>
			{rulesStore.messageDisplayRules.length
				? rulesStore.messageDisplayRules.map((rule: MessageDisplayRule, i: number) => (
						<DraggableDisplayRule
							sessions={sessions}
							rule={rule}
							key={i}
							index={i}
							updateOrder={updateOrder}
							updatePosition={updatePosition}
						/>
				  ))
				: null}
			<DisplayRule sessions={sessions} rule={rulesStore.rootDisplayRule} />
		</div>
	);
};

export default observer(RulesList);

const buffer = 4;

export const findIndex = (i: number, yOffset: number, positions: Position[]) => {
	let target = i;
	const { top, height } = positions[i];
	const bottom = top + height;
	// If moving down
	if (yOffset > 0) {
		const nextItem = positions[i + 1];
		if (nextItem === undefined) return i;
		const swapOffset = Math.abs(bottom - (nextItem.top + nextItem.height / 2));
		if (yOffset > swapOffset) target = i + 1;
		// If moving up
	} else if (yOffset < 0) {
		const prevItem = positions[i - 1];
		if (prevItem === undefined) return i;
		const prevBottom = prevItem.top + prevItem.height;
		const swapOffset = Math.abs(top - (prevBottom - prevItem.height / 2)) + buffer;
		if (yOffset < -swapOffset) target = i - 1;
	}

	return clamp(0, positions.length, target);
};

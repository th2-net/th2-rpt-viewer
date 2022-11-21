/** ****************************************************************************
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

import { createBemElement, createStyleSelector } from 'helpers/styleCreators';
import { MessageViewType } from 'models/EventMessage';

interface Props {
	viewTypes: MessageViewType[];
	selectedViewType?: MessageViewType;
	onViewTypeSelect: (viewType: MessageViewType) => void;
}

export const ViewTypeSelect = (props: Props) => {
	const { viewTypes, selectedViewType, onViewTypeSelect } = props;

	return (
		<div className='message-card-tools__controls-group'>
			{viewTypes.map(vt => {
				const isSelected = vt === selectedViewType;
				const rootClassname = createStyleSelector(
					'message-card-tools__item',
					isSelected ? 'active' : null,
				);
				const iconClassName = createBemElement('message-card-tools', 'icon', vt);
				const indicatorClassName = createBemElement(
					'message-card-tools',
					'indicator',
					isSelected ? 'active' : null,
				);

				return (
					<div title={vt} className={rootClassname} key={vt} onClick={() => onViewTypeSelect(vt)}>
						<div className={iconClassName} />
						<span className='message-card-tools__item-title'>{vt}</span>
						<div className={indicatorClassName} />
					</div>
				);
			})}
		</div>
	);
};

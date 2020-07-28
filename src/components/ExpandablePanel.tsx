/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import { createStyleSelector } from '../helpers/styleCreators';
import { stopPropagationHandler } from '../helpers/react';
import '../styles/expandablePanel.scss';

interface PanelProps {
    isExpanded?: boolean;
    onExpand?: (isExpanded: boolean) => void;
    children: [React.ReactNode | ((onExpand: () => void) => React.ReactNode), React.ReactNode];
	isExpandDisabled?: boolean;
	showExpandButton?: boolean;
}

export const ExpandablePanel = ({
	children,
	isExpanded,
	onExpand,
	isExpandDisabled,
	showExpandButton = true,
}: PanelProps) => {
	const iconClass = createStyleSelector(
		'expandable-panel__icon',
		!isExpanded ? 'hidden' : null,
		isExpandDisabled ? 'disabled' : null,
	);

	const expand = (isPanelExpanded: boolean) => {
		if (!isExpandDisabled && onExpand) {
			onExpand(isPanelExpanded);
		}
	};

	const [header, body] = children;

	return (
		<div className="expandable-panel">
			<div className="expandable-panel__header">
				{
					typeof header === 'function'
						? header(() => expand(!isExpanded))
						: header
				}
				<div className="expandable-panel__button">
					{showExpandButton
					&& <div
						className={iconClass}
						onClick={stopPropagationHandler(expand, !isExpanded)} />}
				</div>
			</div>
			{
				isExpanded ? body : null
			}
		</div>
	);
};

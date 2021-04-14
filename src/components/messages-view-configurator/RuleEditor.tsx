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
import { MessageViewType } from '../../models/EventMessage';
import useDimensions from '../../hooks/useDimensions';
import { createStyleSelector } from '../../helpers/styleCreators';
import { ModalPortal } from '../util/Portal';
import { useOutsideClickListener } from '../../hooks';

interface RuleEditorProps {
	selected: string;
	setSelected: (v: MessageViewType) => void;
	onSelect?: (v: MessageViewType) => void;
	defaultOpen?: boolean;
}

const viewTypes = Object.values(MessageViewType);

const RuleEditor: React.FC<RuleEditorProps> = ({
	selected,
	setSelected,
	onSelect,
	defaultOpen,
}) => {
	const [showOptions, setShowOptions] = React.useState(Boolean(defaultOpen));

	const [btnRef, btnDimensions] = useDimensions<HTMLButtonElement>();
	const listRef = React.useRef(null);

	useOutsideClickListener(listRef, (e: MouseEvent) => {
		if (e.target !== btnRef.current) {
			setShowOptions(false);
		}
	});

	const triggerClassName = createStyleSelector('rules-select-trigger', selected);
	const optionsListClassName = createStyleSelector(
		'rules-select-options-list',
		showOptions ? 'show' : null,
	);

	return (
		<div className='rules-select'>
			<button
				ref={btnRef}
				className={triggerClassName}
				onClick={() => {
					setShowOptions(show => !show);
				}}
			/>
			{btnDimensions ? (
				<ModalPortal
					isOpen={showOptions}
					style={{
						position: 'absolute',
						top: btnDimensions.top,
						left: btnDimensions.left,
						zIndex: 500,
					}}>
					<div className={optionsListClassName} ref={listRef}>
						{viewTypes.map((opt, index) => (
							<button
								className={`rules-select-option`}
								key={index}
								value={opt}
								title={opt}
								onClick={(e: React.MouseEvent) => {
									const viewType = (e.currentTarget as HTMLButtonElement).value as MessageViewType;
									setSelected(viewType);
									setShowOptions(false);
									if (onSelect) {
										onSelect(viewType);
									}
								}}>
								<span className={`select-icon ${opt.toLowerCase()}`} />
								{opt}
							</button>
						))}
					</div>
				</ModalPortal>
			) : null}
		</div>
	);
};

export default RuleEditor;

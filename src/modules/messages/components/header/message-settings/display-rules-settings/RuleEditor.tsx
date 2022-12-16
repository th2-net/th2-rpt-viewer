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

import { useCallback, useState, useRef } from 'react';
import { MessageViewType } from 'models/EventMessage';
import useDimensions from 'hooks/useDimensions';
import { createStyleSelector } from 'helpers/styleCreators';
import { ModalPortal } from 'components/util/Portal';
import { useOutsideClickListener } from 'hooks/index';
import { viewTypeIcons, ViewTypesList } from '../../../message-card/ViewTypesList';

interface RuleEditorProps {
	selected: string;
	setSelected: (v: MessageViewType) => void;
	onSelect?: (v: MessageViewType) => void;
	defaultOpen?: boolean;
}

const viewTypes = Object.values(MessageViewType);

const RuleEditor = ({ selected, setSelected, onSelect, defaultOpen }: RuleEditorProps) => {
	const [showOptions, setShowOptions] = useState(Boolean(defaultOpen));

	const [btnRef, btnDimensions] = useDimensions<HTMLButtonElement>();
	const listRef = useRef(null);

	useOutsideClickListener(listRef, (e: MouseEvent) => {
		if (e.target !== btnRef.current) {
			setShowOptions(false);
		}
	});

	const optionsListClassName = createStyleSelector(
		'rules-select-options-list',
		showOptions ? 'show' : null,
	);

	const onViewTypeSelect = useCallback(
		viewType => {
			setSelected(viewType);
			setShowOptions(false);
			if (onSelect) {
				onSelect(viewType);
			}
		},
		[onSelect, setSelected],
	);

	const toggleOptionsList = () => setShowOptions(isOpen => !isOpen);

	const Icon = viewTypeIcons[selected as MessageViewType];

	return (
		<div className='rules-select'>
			<button ref={btnRef} className='rules-select__button' onClick={toggleOptionsList}>
				<Icon />
			</button>
			{btnDimensions ? (
				<ModalPortal
					isOpen={showOptions}
					style={{
						position: 'absolute',
						top: btnDimensions.top,
						left: btnDimensions.left,
						zIndex: 500,
						transform: 'translate(-95%, 0)',
					}}>
					<div className={optionsListClassName} ref={listRef}>
						<ViewTypesList
							onViewTypeSelect={onViewTypeSelect}
							viewTypes={viewTypes}
							selectedViewType={selected as MessageViewType}
						/>
					</div>
				</ModalPortal>
			) : null}
		</div>
	);
};

export default RuleEditor;
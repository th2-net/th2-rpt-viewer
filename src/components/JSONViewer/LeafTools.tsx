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

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TreeViewType } from '../../models/JSONSchema';
import { useOutsideClickListener } from '../../hooks';
import { createBemElement } from '../../helpers/styleCreators';

export type LeafToolsConfig = {
	treeViewType: TreeViewType;
	toggleViewType: (viewType: TreeViewType) => void;
};

const LeafTools = ({ treeViewType, toggleViewType }: LeafToolsConfig) => {
	const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useOutsideClickListener(
		rootRef,
		(e: MouseEvent) => {
			if (e.target instanceof Element && rootRef.current && !rootRef.current.contains(e.target)) {
				setIsViewMenuOpen(false);
			}
		},
		isViewMenuOpen,
	);

	const viewTypes = [TreeViewType.EVENTS_LIST, TreeViewType.JSON, TreeViewType.PRETTY];

	return (
		<div className='message-card-tools' ref={rootRef}>
			<div
				className={createBemElement(
					'message-card-tools',
					'button',
					isViewMenuOpen ? 'active' : null,
				)}
				onClick={e => {
					e.stopPropagation();
					setIsViewMenuOpen(isOpen => !isOpen);
				}}>
				<div className='message-card-tools__ellipsis' style={{ display: 'block' }} />
			</div>
			<ToolsPopup isOpen={isViewMenuOpen}>
				<div className='message-card-tools__controls-group'>
					{viewTypes.map(viewType => {
						const iconClassName = createBemElement('message-card-tools', 'icon', viewType);
						const indicatorClassName = createBemElement(
							'message-card-tools',
							'indicator',
							viewType === treeViewType ? 'active' : null,
						);

						return (
							<div
								title={viewType}
								className='message-card-tools__item'
								key={viewType}
								onClick={e => {
									e.stopPropagation();
									toggleViewType(viewType);
								}}>
								<span className='message-card-tools__item-title'>{viewType}</span>
								<div className={iconClassName} />
								<div className={indicatorClassName} />
							</div>
						);
					})}
				</div>
			</ToolsPopup>
		</div>
	);
};

export default LeafTools;

interface ToolsPopupProps {
	isOpen: boolean;
	children: React.ReactNode;
}

function ToolsPopup({ isOpen, children }: ToolsPopupProps) {
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className='message-card-tools__controls'
					style={{ transformOrigin: 'top' }}
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.5 }}
					transition={{ duration: 0.15, ease: 'easeOut' }}>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

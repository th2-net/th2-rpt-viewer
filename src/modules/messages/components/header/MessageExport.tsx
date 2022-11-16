/** ****************************************************************************
 * Copyright 2021-2022 Exactpro (Exactpro Systems Limited)
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

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageViewType } from 'models/EventMessage';
import { ButtonBase } from 'components/buttons/ButtonBase';

interface Props {
	isExporting: boolean;
	enableExport: () => void;
	disableExport: () => void;
	endExport: (messageViewType: MessageViewType) => void;
	exportedCount: number;
}

const viewTypes = Object.values(MessageViewType);

const MessageExport = (props: Props) => {
	const {
		isExporting,
		enableExport,
		disableExport,
		endExport,
		exportedCount: exportAmount,
	} = props;
	const [isOpen, setIsOpen] = React.useState(false);

	const exportMessages = (messageViewType: MessageViewType) => {
		setIsOpen(false);
		endExport(messageViewType);
	};

	const closeExport = () => {
		disableExport();
		setIsOpen(false);
	};

	function onExport() {
		if (!isExporting) {
			enableExport();
			return;
		}
		if (isExporting && exportAmount === 0) {
			closeExport();
			return;
		}
		setIsOpen(true);
	}

	return (
		<>
			<ButtonBase className='messages-export__button' onClick={onExport}>
				<span className='messages-export__icon'></span>
				Export
				<span className='messages-export__counter'>{exportAmount}</span>
			</ButtonBase>
			<div className='messages-export__export'>
				<AnimatePresence>
					{isOpen && (
						<motion.div
							className='messages-export__tools-list'
							style={{ transformOrigin: 'top' }}
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.5 }}
							transition={{ duration: 0.15, ease: 'easeOut' }}>
							{viewTypes.map(type => (
								<button
									key={type}
									className='messages-export__tool'
									title={`Export to ${type}`}
									onClick={() => exportMessages(type)}>
									<i className={`messages-export ${type.toLowerCase()}`} />
								</button>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</>
	);
};

export default MessageExport;

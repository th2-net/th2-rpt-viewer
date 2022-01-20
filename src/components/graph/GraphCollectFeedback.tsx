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
import { useOutsideClickListener } from '../../hooks';
import { ModalPortal } from '../util/Portal';
import CollectFeedbackModal from './CollectFeedbackModal';
import '../../styles/collect-feedback.scss';

const GraphCollectFeedbackButton = () => {
	const [isOpen, setIsOpen] = useState(false);
	const modalRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		if (e.target !== buttonRef.current) {
			setIsOpen(false);
		}
	});

	const toggleModal = () => {
		setIsOpen(o => !o);
	};

	return (
		<>
			<button ref={buttonRef} onClick={toggleModal} className='collect-feedback-button'>
				collect feedback
			</button>
			<ModalPortal
				isOpen={isOpen}
				ref={modalRef}
				style={{
					position: 'absolute',
					top: '35px',
					left: '90px',
					zIndex: 500,
				}}>
				<CollectFeedbackModal toggleModal={toggleModal} isOpen={isOpen} />
			</ModalPortal>
		</>
	);
};

export default GraphCollectFeedbackButton;

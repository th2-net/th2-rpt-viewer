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

import React, { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { ModalPortal } from '../util/Portal';
import '../../styles/filters-history.scss';
import { useOutsideClickListener } from '../../hooks';
import { raf } from '../../helpers/raf';

const FiltersHistory = () => {
	const [isOpen, setIsOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const historyRef = useRef<HTMLDivElement>(null);

	React.useLayoutEffect(() => {
		if (isOpen) {
			raf(() => {
				if (historyRef.current && buttonRef.current) {
					const { left, bottom } = buttonRef.current?.getBoundingClientRect();
					historyRef.current.style.left = `${left}px`;
					historyRef.current.style.top = `${bottom}px`;
				}
			}, 2);
		}
	}, [isOpen]);

	useOutsideClickListener(historyRef, (e: MouseEvent) => {
		if (e.target !== buttonRef.current) {
			setIsOpen(false);
		}
	});
	return (
		<>
			<button
				ref={buttonRef}
				className='filters-history-open'
				onClick={() => {
					setIsOpen(o => !o);
				}}>
				Filters history
			</button>

			<ModalPortal isOpen={isOpen}>
				<div ref={historyRef} className='filters-history'>
					filters history
				</div>
			</ModalPortal>
		</>
	);
};

export default observer(FiltersHistory);

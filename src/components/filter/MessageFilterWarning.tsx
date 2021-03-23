/** *****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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
import React from 'react';
import { useMessagesWorkspaceStore, useOutsideClickListener } from 'hooks';
import { ActionFilterConfig } from 'models/filter/FilterInputs';
import { ModalPortal } from '../util/Portal';
import ActionRow from './row/ActionRow';

const MessageFilterWarning = () => {
	const messagesStore = useMessagesWorkspaceStore();

	const [showHintModal, setShowHintModal] = React.useState(false);

	const filterHintButtonRef = React.useRef<HTMLButtonElement>(null);
	const filterHintModalRef = React.useRef<HTMLDivElement>(null);

	const filterWarningHintConfig: ActionFilterConfig = {
		type: 'action',
		id: 'filter-warning-hint',
		message: 'Message may not match the filter',
		actionButtonText: 'Change filter',
		action: () => {
			messagesStore.applyFilterHint();
			setShowHintModal(false);
		},
	};

	const { left, top } = (() => {
		const refButtonRect = filterHintButtonRef.current?.getBoundingClientRect();

		if (!refButtonRect) {
			return {
				top: 0,
				left: 0,
			};
		}

		return {
			left: refButtonRect.left,
			top: refButtonRect.top + refButtonRect.height,
		};
	})();

	useOutsideClickListener(filterHintModalRef, () => {
		setShowHintModal(false);
	});

	return (
		<>
			{messagesStore.showFilterChangeHint && (
				<button
					className='filter-warning-button'
					onClick={() => setShowHintModal(!showHintModal)}
					ref={filterHintButtonRef}>
					<i className='filter-warning-icon' />
				</button>
			)}
			<ModalPortal isOpen={showHintModal}>
				<div
					ref={filterHintModalRef}
					className='filter-hint-modal'
					style={{
						top,
						left,
					}}>
					<ActionRow config={filterWarningHintConfig} />
				</div>
			</ModalPortal>
		</>
	);
};

export default observer(MessageFilterWarning);

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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import moment from 'moment';
import { createBemElement } from '../../../helpers/styleCreators';
import { useOutsideClickListener } from '../../../hooks/useOutsideClickListener';
import { TimeRange } from '../../../models/Timestamp';
import GraphSearchDialog from './GraphSearchDialog';
import WorkspaceStore from '../../../stores/workspace/WorkspaceStore';
import { ModalPortal } from '../../util/Portal';
import GraphSearchInput, { GraphSearchInputConfig } from './GraphSearchInput';
import { GraphSearchTimePicker } from './GraphSearchTimePicker';
import KeyCodes from '../../../util/KeyCodes';
import { EventAction } from '../../../models/EventAction';
import { EventMessage, EventMessageItem } from '../../../models/EventMessage';

interface Props {
	onTimestampSubmit: (timestamp: number) => void;
	onFoundItemClick: InstanceType<typeof WorkspaceStore>['onSavedItemSelect'];
	windowRange: TimeRange | null;
	hoveredTimestamp: number | null;
}

export type GraphSearchMode = 'timestamp' | 'history';
export interface GraphSearchResult {
	timestamp: number;
	id: string;
	item: EventAction | EventMessageItem;
}

function GraphSearch(props: Props) {
	const { onTimestampSubmit, onFoundItemClick, windowRange, hoveredTimestamp } = props;

	const [inputConfig, setInputConfig] = React.useState<GraphSearchInputConfig>({
		isValidDate: false,
		mask: null,
		placeholder: null,
		timestamp: null,
		value: '',
	});

	const [timestamp, setTimestamp] = React.useState<number | null>(null);
	const [submittedId, setSubmittedId] = React.useState<String | null>(null);

	const [mode, setMode] = React.useState<GraphSearchMode>('timestamp');
	// If user selects mode input will no longer switch automatically based on input value
	const [isModeLocked, setIsModeLocked] = React.useState(false);

	const [isIdSearchDisabled, setIsIdSearchDisabled] = React.useState(false);

	const [showModal, setShowModal] = React.useState(false);

	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const modalRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(
		wrapperRef,
		e => {
			if (
				showModal &&
				e.target instanceof Node &&
				!wrapperRef.current?.contains(e.target) &&
				!modalRef.current?.contains(e.target)
			) {
				setShowModal(false);

				if (
					typeof inputConfig.timestamp === 'number' &&
					inputConfig.isValidDate &&
					inputConfig.timestamp <= moment.utc().valueOf()
				) {
					onTimestampSubmit(inputConfig.timestamp);
				}
			}
		},
		'mouseup',
	);

	React.useEffect(() => {
		if (!showModal) {
			setIsModeLocked(false);
			setIsIdSearchDisabled(false);
			setSubmittedId(null);
		}
	}, [showModal]);

	const handleKeyDown = React.useCallback(
		(e: KeyboardEvent) => {
			const { timestamp: currentTimestamp, isValidDate } = inputConfig;

			if (
				mode === 'timestamp' &&
				showModal &&
				isValidDate &&
				typeof currentTimestamp === 'number' &&
				e.keyCode === KeyCodes.ENTER
			) {
				timestampSearch(currentTimestamp);
			}

			if (e.keyCode === KeyCodes.ESCAPE) {
				setShowModal(false);
			}
		},
		[inputConfig, mode, showModal, timestamp],
	);

	React.useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	const handleTimepickerValueChange = React.useCallback(
		(value: number | null) => {
			setTimestamp(value);
		},
		[setTimestamp],
	);

	const handleModeChange = React.useCallback(
		(newMode: GraphSearchMode) => {
			setShowModal(true);
			if (!isModeLocked) {
				setMode(newMode);
			}
		},
		[setMode, setShowModal, isModeLocked],
	);

	const onModeSelect = (newMode: GraphSearchMode) => {
		setTimestamp(null);
		setMode(newMode);
		setIsModeLocked(true);
	};

	const timestampSearch = (startTimestamp: number) => {
		setTimestamp(startTimestamp);
		setMode('history');
	};

	const handleModalSubmit = () => {
		if (
			mode === 'timestamp' &&
			typeof inputConfig.timestamp === 'number' &&
			inputConfig.isValidDate
		) {
			timestampSearch(inputConfig.timestamp);
		}

		if (mode === 'history') {
			setSubmittedId(new String(inputConfig.value));
		}
	};

	const closeModal = React.useCallback(() => {
		setShowModal(false);
		setTimestamp(null);
	}, [setShowModal]);

	const onGraphSearchResultSelect = React.useCallback(
		(searchResult: GraphSearchResult) => {
			onFoundItemClick(searchResult.item);
			setShowModal(false);
		},
		[onFoundItemClick],
	);

	const isSubmitButtonActive = mode === 'timestamp' ? inputConfig.isValidDate : !isIdSearchDisabled;

	const dateButtonClassName = createBemElement(
		'graph-search',
		'switcher-button',
		mode === 'timestamp' ? 'active' : null,
	);

	const idButtonClassName = createBemElement(
		'graph-search',
		'switcher-button',
		mode === 'history' ? 'active' : null,
	);

	return (
		<div className='graph-search' ref={wrapperRef}>
			<GraphSearchInput
				timestamp={timestamp}
				setTimestamp={handleTimepickerValueChange}
				setMode={handleModeChange}
				inputConfig={inputConfig}
				setInputConfig={setInputConfig}
				mode={mode}
				windowRange={windowRange}
				hoveredTimestamp={hoveredTimestamp}
				submitTimestamp={onTimestampSubmit}
			/>
			<ModalPortal
				isOpen={showModal}
				ref={modalRef}
				style={{
					left: '50%',
					transform: 'translateX(-50%)',
					top: wrapperRef.current?.getBoundingClientRect().bottom || 30,
					position: 'absolute',
					zIndex: 110,
				}}>
				<div className='graph-search__modal'>
					{mode === 'timestamp' && (
						<GraphSearchTimePicker
							timestamp={inputConfig.timestamp}
							setTimestamp={handleTimepickerValueChange}
						/>
					)}
					{mode === 'history' && (
						<GraphSearchDialog
							value={inputConfig.value}
							onSearchResultSelect={onGraphSearchResultSelect}
							setTimestamp={handleTimepickerValueChange}
							setIsIdSearchDisabled={setIsIdSearchDisabled}
							closeModal={closeModal}
							submittedId={submittedId}
							submittedTimestamp={timestamp}
							isIdMode={showModal && mode === 'history'}
						/>
					)}
					<div className='graph-search__switchers'>
						<button className={dateButtonClassName} onClick={() => onModeSelect('timestamp')}>
							Timestamp
						</button>
						<button className={idButtonClassName} onClick={() => onModeSelect('history')}>
							History
						</button>
						<button
							onClick={handleModalSubmit}
							className={createBemElement(
								'graph-search',
								'submit-button',
								isSubmitButtonActive ? 'active' : null,
							)}>
							OK
						</button>
					</div>
				</div>
			</ModalPortal>
		</div>
	);
}

export default React.memo(GraphSearch);

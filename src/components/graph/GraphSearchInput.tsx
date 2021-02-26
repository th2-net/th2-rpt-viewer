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
import eventHttpApi from '../../api/event';
import messageHttpApi from '../../api/message';
import { formatTimestampValue } from '../../helpers/date';
import { isEventAction } from '../../helpers/event';
import { createBemElement } from '../../helpers/styleCreators';
import { useActiveWorkspace, useDebouncedCallback } from '../../hooks';
import { useOutsideClickListener } from '../../hooks/useOutsideClickListener';
import { EventAction } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { DateTimeMask } from '../../models/filter/FilterInputs';
import { Timestamp } from '../../models/Timestamp';
import KeyCodes from '../../util/KeyCodes';
import GraphSearchDialog from './GraphSearchDialog';
import '../../styles/timestamp-input.scss';
import localStorageWorker from '../../util/LocalStorageWorker';

const getTimestamp = (timestamp: Timestamp) => {
	const ms = Math.floor(timestamp.nano / 1000000);
	return +`${timestamp.epochSecond}${ms}`;
};

function parseDateString(dateStr: string): number {
	const dateMasks = [
		'YYYY-MM-DD HH:mm:ss.SSS',
		'YYYY-MM-DD HH:mm:ss',
		'YYYY-MM-DD HH:mm',
		'YYYY-MM-DD HH',
	];
	let i = 0;
	while (i < dateMasks.length) {
		const date = moment(dateStr, dateMasks[i], true);

		if (date.isValid()) return date.valueOf() - new Date().getTimezoneOffset() * 60000;
		i++;
	}

	throw new Error('Invalid date string');
}

interface Props {
	timestamp: number;
	wrapperClassName?: string;
	className?: string;
	style?: React.CSSProperties;
	readonly?: boolean;
	placeholder?: string;
	onTimestampSubmit: (timestamp: number) => void;
}

const GraphSearchInput = (props: Props) => {
	const {
		timestamp,
		readonly = false,
		placeholder = 'Go to ID or Timestamp',
		style,
		onTimestampSubmit,
	} = props;

	const activeWorkspace = useActiveWorkspace();
	const [currentValue, setCurrentValue] = React.useState(
		moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss.SSS'),
	);
	const [currentTimestamp, setCurrentTimestamp] = React.useState(0);
	const [foundObject, setFoundbject] = React.useState<EventAction | EventMessage | null>(null);
	const [dimensions, setDimensions] = React.useState<DOMRect | null>(null);
	const [isLoading, setIsLoading] = React.useState(false);
	const [showPicker, setShowPicker] = React.useState(false);
	const [showDialog, setShowDialog] = React.useState(false);
	const [history, setHistory] = React.useState<Array<EventAction | EventMessage>>(
		localStorageWorker.getGraphSearchHistory(),
	);

	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const timeout = React.useRef<NodeJS.Timeout>();

	useOutsideClickListener(
		wrapperRef,
		() => {
			setShowPicker(false);
			setShowDialog(false);
		},
		'mouseup',
	);

	React.useEffect(() => {
		if (wrapperRef.current) {
			setDimensions(wrapperRef.current.getBoundingClientRect());
		}
	}, [wrapperRef.current]);

	React.useEffect(() => {
		setCurrentValue(moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss.SSS'));
		setCurrentTimestamp(timestamp);
	}, [timestamp]);

	React.useEffect(() => {
		const ac = new AbortController();

		if (showDialog) {
			try {
				const parsedTimestamp = parseDateString(currentValue);
				setCurrentTimestamp(parsedTimestamp);
				setIsLoading(false);
			} catch (error) {
				setIsLoading(true);
				setTimestampFromFoundObject(ac);
			}
		}
		return () => {
			ac.abort();
		};
	}, [currentValue, showDialog]);

	React.useEffect(() => {
		if (foundObject) {
			activeWorkspace.onSavedItemSelect(foundObject);
			localStorageWorker.saveGraphSearchHistory([...history, foundObject]);
			setHistory(localStorageWorker.getGraphSearchHistory());
			timeout.current = setTimeout(() => {
				setShowDialog(false);
			}, 2000);
		}
	}, [foundObject]);

	const onObjectFound = (
		object: null | EventAction | EventMessage,
		id: string,
		ac: AbortController,
	) => {
		setIsLoading(false);
		if (!object) {
			return;
		}
		ac.abort();
		const timestamFromFoundObject = isEventAction(object)
			? getTimestamp(object.startTimestamp)
			: getTimestamp(object.timestamp);
		setCurrentTimestamp(timestamFromFoundObject);
		setCurrentValue(formatTimestampValue(timestamFromFoundObject, DateTimeMask.DATE_TIME_MASK));
	};

	const setTimestampFromFoundObject = useDebouncedCallback((ac: AbortController) => {
		eventHttpApi.getEvent(currentValue, ac.signal, { probe: true }).then(foundEvent => {
			setFoundbject(foundEvent);
			onObjectFound(foundEvent, currentValue, ac);
		});
		messageHttpApi.getMessage(currentValue, ac.signal, { probe: true }).then(message => {
			setFoundbject(message);
			onObjectFound(message, currentValue, ac);
		});
	}, 500);

	const toggleDatepicker = () => {
		setShowPicker(currentShowPicker => !currentShowPicker);
	};

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCurrentValue(e.target.value);
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.keyCode === KeyCodes.ENTER) {
			onTimestampSubmit(currentTimestamp);
		}
	};

	const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		e.target.setSelectionRange(0, currentValue.length);
		setShowDialog(true);
		if (timeout.current) clearTimeout(timeout.current);
		setFoundbject(null);
	};

	const dialogClassName = createBemElement(
		'timestamp-input',
		'dialog',
		foundObject || isLoading || history.length > 0 ? 'bordered' : null,
	);

	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		className: 'timestamp-input__input',
		style,
		readOnly: readonly,
		value: currentValue,
		placeholder,
		onChange,
		onKeyDown,
		onFocus,
	};

	const datepickerButtonClassName = createBemElement('timestamp-input', 'datepicker-button');

	return (
		<div className='timestamp-input' ref={wrapperRef}>
			<input {...inputProps} />
			<button className={datepickerButtonClassName} onClick={toggleDatepicker} />
			<GraphSearchDialog
				history={history}
				className={dialogClassName}
				isOpen={showDialog}
				isLoading={isLoading}
				rect={dimensions}
				foundObject={foundObject}
			/>
		</div>
	);
};

export default GraphSearchInput;

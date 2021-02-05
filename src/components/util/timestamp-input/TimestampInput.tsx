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
import eventHttpApi from '../../../api/event';
import messageHttpApi from '../../../api/message';
import { formatTimestampValue } from '../../../helpers/date';
import { isEventAction } from '../../../helpers/event';
import { createBemElement } from '../../../helpers/styleCreators';
import { useDebouncedCallback } from '../../../hooks';
import { useOutsideClickListener } from '../../../hooks/useOutsideClickListener';
import { EventAction } from '../../../models/EventAction';
import { EventMessage } from '../../../models/EventMessage';
import { DateTimeMask } from '../../../models/filter/FilterInputs';
import { Timestamp } from '../../../models/Timestamp';
import KeyCodes from '../../../util/KeyCodes';
import TimestampDialog from './TimestampDialog';
import '../../../styles/timestamp-input.scss';

const getTimestamp = (timestamp: Timestamp) => {
	const ms = Math.floor(timestamp.nano / 1000000);
	return +`${timestamp.epochSecond}${ms}`;
};

const dateFormatPattern = /([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/g;

interface Props {
	event: EventAction | null;
	timestamp: number;
	wrapperClassName?: string;
	className?: string;
	style?: React.CSSProperties;
	readonly?: boolean;
	placeholder?: string;
	onSubmit: (timestamp: number) => void;
}

const TimestampInput = (props: Props) => {
	const {
		event,
		timestamp,
		wrapperClassName = 'timestamp-input',
		readonly = false,
		className = '',
		placeholder = 'Go to ID or Timestamp',
		style,
		onSubmit,
	} = props;

	const [currentValue, setCurrentValue] = React.useState(
		moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss.SSS'),
	);
	const [currentTimestamp, setCurrentTimestamp] = React.useState(0);
	const [currentEventOrMessage, setCurrentEventOrMessage] = React.useState<
		EventAction | EventMessage | null
	>(event);
	const [dimensions, setDimensions] = React.useState<DOMRect | null>(null);
	const [isLoading, setIsLoading] = React.useState(false);
	const [showPicker, setShowPicker] = React.useState(false);
	const [showDialog, setShowDialog] = React.useState(false);

	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const timeout = React.useRef<NodeJS.Timeout>();

	useOutsideClickListener(wrapperRef, () => {
		setShowPicker(false);
		timeout.current = setTimeout(() => {
			setShowDialog(false);
		}, 2000);
	});

	React.useEffect(() => {
		if (wrapperRef.current) {
			setDimensions(wrapperRef.current.getBoundingClientRect());
		}
	}, [wrapperRef.current]);

	React.useEffect(() => {
		const ac = new AbortController();
		const date = currentValue.split(' ')[0];
		if (currentValue !== '' && !dateFormatPattern.test(date)) {
			setIsLoading(true);
			setTimestampFromEventOrMessage(ac);
		}
		return () => {
			ac.abort();
		};
	}, [currentValue]);

	const setTimestamp = (eventOrMessage: null | EventAction | EventMessage, ac: AbortController) => {
		setIsLoading(false);
		if (!eventOrMessage) {
			return;
		}
		ac.abort();
		const timestampFromEventOrMessage = isEventAction(eventOrMessage)
			? getTimestamp(eventOrMessage.startTimestamp)
			: getTimestamp(eventOrMessage.timestamp);
		setCurrentTimestamp(timestampFromEventOrMessage);
		setCurrentValue(formatTimestampValue(timestampFromEventOrMessage, DateTimeMask.DATE_TIME_MASK));
	};

	const setTimestampFromEventOrMessage = useDebouncedCallback((ac: AbortController) => {
		eventHttpApi.getEvent(currentValue, ac.signal, { probe: true }).then(foundEvent => {
			setCurrentEventOrMessage(foundEvent);
			setTimestamp(foundEvent, ac);
		});
		messageHttpApi.getMessage(currentValue, ac.signal, { probe: true }).then(message => {
			setCurrentEventOrMessage(message);
			setTimestamp(message, ac);
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
			onSubmit(currentTimestamp);
		}
	};

	const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		e.target.setSelectionRange(0, currentValue.length);
		setShowDialog(true);
		if (timeout.current) clearTimeout(timeout.current);
	};

	const inputClassName = createBemElement(wrapperClassName, 'input');
	const dialogClassName = createBemElement(
		wrapperClassName,
		'dialog',
		currentEventOrMessage || isLoading ? 'bordered' : null,
	);
	const datepickerButtonClassName = createBemElement(wrapperClassName, 'datepicker-button');

	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		className: `${inputClassName}${className ? ` ${className}` : ''}`,
		style,
		readOnly: readonly,
		value: currentValue,
		placeholder,
		onChange,
		onKeyDown,
		onFocus,
	};

	return (
		<div className={wrapperClassName} ref={wrapperRef}>
			<input {...inputProps} />
			<button className={datepickerButtonClassName} onClick={toggleDatepicker} />
			<TimestampDialog
				className={dialogClassName}
				isOpen={showDialog}
				isLoading={isLoading}
				rect={dimensions}
				foundObject={currentEventOrMessage}
			/>
		</div>
	);
};

export default TimestampInput;

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
import eventHttpApi from '../../api/event';
import messageHttpApi from '../../api/message';
import { formatTimestampValue } from '../../helpers/date';
import { createBemElement } from '../../helpers/styleCreators';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import { DateTimeMask } from '../../models/filter/FilterInputs';
import Timestamp from '../../models/Timestamp';
import '../../styles/timestamp-input.scss';

const getTimestamp = (timestamp: Timestamp) => {
	const ms = Math.floor(timestamp.nano / 1000000);
	return +`${timestamp.epochSecond}${ms}`;
};

const dateFormatPattern = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/g;

interface Props {
	wrapperClassName?: string;
	className?: string;
	style?: React.CSSProperties;
	readonly?: boolean;
	placeholder?: string;
	datepicker?: boolean;
}

const TimestampInput = (props: Props) => {
	const {
		wrapperClassName = 'timestamp-input',
		datepicker = true,
		readonly = false,
		className = '',
		placeholder = 'Go to ID or Timestamp',
		style,
	} = props;

	const [currentValue, setCurrentValue] = React.useState<string>('');
	const [focus, setFocus] = React.useState<boolean>(false);
	const [currentTimestamp, setCurrentTimestamp] = React.useState<number | null>(null);
	const [showPicker, setShowPicker] = React.useState<boolean>(false);

	const wrapperRef = React.useRef<HTMLDivElement | null>(null);

	const outsideClickListener = () => {
		setShowPicker(false);
	};

	useOutsideClickListener(wrapperRef, outsideClickListener);

	React.useEffect(() => {
		const date = currentValue.split(' ')[0];
		const eventAbortController = new AbortController();
		const messageAbortController = new AbortController();

		if (!focus && currentValue !== '' && !dateFormatPattern.test(date)) {
			const event = getEvent(currentValue, eventAbortController.signal);
			const message = getMessage(currentValue, messageAbortController.signal);

			event.then(e => {
				if (!e) {
					return;
				}
				messageAbortController.abort();
				const timestamp = getTimestamp(e.startTimestamp);
				setCurrentTimestamp(timestamp);
			});

			message.then(m => {
				if (!m) {
					return;
				}
				eventAbortController.abort();
				const timestamp = getTimestamp(m.timestamp);
				setCurrentTimestamp(timestamp);
			});
		}
		return () => {
			eventAbortController.abort();
			messageAbortController.abort();
		};
	}, [focus, currentValue]);

	React.useEffect(() => {
		const timestamp = formatTimestampValue(currentTimestamp, DateTimeMask.DATE_TIME_MASK);
		setCurrentValue(timestamp);
	}, [currentTimestamp]);

	const getMessage = async (messageId: string, signal: AbortSignal) => {
		const message = await messageHttpApi.getMessage(messageId, signal, { probe: true });
		return message;
	};

	const getEvent = async (eventId: string, signal: AbortSignal) => {
		const event = await eventHttpApi.getEvent(eventId, signal, { probe: true });
		return event;
	};

	const toggleDatepicker = () => {
		setShowPicker(currentShowPicker => !currentShowPicker);
	};

	const onChange: React.ChangeEventHandler<HTMLInputElement> = e => {
		setCurrentValue(e.target.value);
	};

	const onInputBlur = () => {
		setFocus(false);
	};

	const onInputFocus = () => {
		setFocus(true);
	};

	const inputClassName = createBemElement(wrapperClassName, 'input');
	const datepickerButtonClassName = createBemElement(wrapperClassName, 'datepicker-button');

	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		className: `${inputClassName}${className ? ` ${className}` : ''}`,
		style,
		readOnly: readonly,
		value: currentValue,
		placeholder,
		onChange,
		onFocus: onInputFocus,
		onBlur: onInputBlur,
	};

	return (
		<div className={wrapperClassName} ref={wrapperRef}>
			<input {...inputProps} />
			{datepicker && <button className={datepickerButtonClassName} onClick={toggleDatepicker} />}
		</div>
	);
};

TimestampInput.displayName = 'TimestampInput';

export default TimestampInput;

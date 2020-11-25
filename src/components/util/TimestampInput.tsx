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
import { DateTimeMask } from '../../models/filter/FilterInputs';
import Timestamp from '../../models/Timestamp';

const getTimestamp = (timestamp: Timestamp) => {
	const ms = Math.floor(timestamp.nano / 1000000);
	return +`${timestamp.epochSecond}${ms}`;
};

const dateFormatPattern = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/g;

interface Props {
	className?: string;
	style?: React.CSSProperties;
	readonly?: boolean;
	placeholder?: string;
}

const TimestampInput = (props: Props) => {
	const { readonly = false, className = '', placeholder = '', style } = props;

	const [currentValue, setCurrentValue] = React.useState<string>('');
	const ref = React.useRef<HTMLInputElement | null>(null);

	const onChange: React.ChangeEventHandler<HTMLInputElement> = e => {
		setCurrentValue(e.target.value);
	};

	const getTimestampFromMessage = async (messageId: string) => {
		const message = await messageHttpApi.getMessage(messageId, undefined, { probe: true });
		if (!message) {
			return;
		}
		const timestamp = getTimestamp(message.timestamp);
		setCurrentValue(formatTimestampValue(timestamp, DateTimeMask.DATE_TIME_MASK));
	};

	const getTimestampFromEventOrMessage = async (eventId: string) => {
		const event = await eventHttpApi.getEvent(eventId, undefined, { probe: true });
		if (!event) {
			getTimestampFromMessage(eventId);
			return;
		}
		const timestamp = getTimestamp(event.startTimestamp);
		setCurrentValue(formatTimestampValue(timestamp, DateTimeMask.DATE_TIME_MASK));
	};

	const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const date = e.target.value.split(' ')[0];
		if (!dateFormatPattern.test(date)) {
			getTimestampFromEventOrMessage(e.target.value);
		}
	};

	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		className,
		style,
		readOnly: readonly,
		value: currentValue,
		placeholder,
		onChange,
		onBlur,
	};

	return <input {...inputProps} ref={ref} />;
};

TimestampInput.displayName = 'TimestampInput';

export default TimestampInput;

/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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


import * as React from 'react';
import MaskedInput from 'react-text-mask';
import {
	 isExists, isPast, isToday, format,
} from 'date-fns';
import {
	FilterRowConfig,
	FilterRowDatetimeRangeConfig,
	FilterRowMultipleStringsConfig,
	FilterRowStringConfig,
} from './FilterPanel';
import Bubble from '../util/Bubble';
import AutocompleteInput from '../util/AutocompleteInput';
import { removeByIndex, replaceByIndex } from '../../helpers/array';
import { createBemElement } from '../../helpers/styleCreators';
import { toUTCDate } from '../../helpers/date';

interface Props {
	rowConfig: FilterRowConfig;
}

export default function FilterPanelRow({ rowConfig }: Props) {
	switch (rowConfig.type) {
		case 'datetime-range':
			return (
				<DatetimeRow config={rowConfig}/>
			);
		case 'string':
			return (
				<StringRow config={rowConfig}/>
			);
		case 'multiple-strings':
			return (
				<MultipleStringRow config={rowConfig}/>
			);
		default:
			return null;
	}
}

function DatetimeRow({ config }: { config: FilterRowDatetimeRangeConfig }) {
	const fromId = `${config.id}-from`;
	const toId = `${config.id}-to`;
	const inputMask = [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/, ',', ' ', /\d/, /\d/, ':', /\d/, /\d/];
	const [isFromInputValid, setIsFromValue] = React.useState(config.fromValue !== null);
	const [isToInputValid, setIsToValue] = React.useState(config.toValue !== null);

	const fromInputClasses = createBemElement('filter-row', 'input', isFromInputValid ? 'valid' : null);
	const toInputClasses = createBemElement('filter-row', 'input', isToInputValid ? 'valid' : null);

	const formatTimestampValue = (timestamp: number | null) => {
		if (timestamp == null) {
			return '';
		}

		const date = new Date(timestamp);
		const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
		return format(utcDate, 'MM/dd/yyyy, HH:mm');
	};

	const validPipe = (maskedValue: string):
		string | false => {
		if (is29February(maskedValue)) {
			if (!maskedValue.substr(6, 4).includes('_')) {
				const value = maskedValue.replace(/_/g, '1');
				const date = new Date(value);
				if (!isCorrectDate(maskedValue)) {
					if (isPast(date) || isToday(date)) {
						return maskedValue.replace('29', '28');
					}
					return false;
				}
				return maskedValue;
			}
			return maskedValue;
		}
		if (isCorrectDate(maskedValue)) {
			return maskedValue;
		}
		return false;
	};

	const is29February = (maskedValue: string): boolean => maskedValue.includes('02/29');

	const isCorrectDate = (maskedValue: string): boolean => {
		const value = maskedValue.replace(/_/g, '1');
		const [month, day, year] = value.substr(0, 10).split('/');
		let isNotFuture = true;
		if (!maskedValue.substr(6, 4).includes('_')) {
			const date = new Date(value);
			isNotFuture = isPast(date) || isToday(date);
		}
		const [hours, minutes] = value.substr(12, 5).split(':');
		const isTimeCorrect = (parseInt(hours) < 24) && (parseInt(minutes) < 60);
		return isExists(
			parseInt(year),
			parseInt(month) - 1,
			parseInt(day),
		) && isTimeCorrect && isNotFuture;
	};

	const onInputBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (isCorrectDate(e.target.value) && !e.target.value.includes('_')) {
			const date = new Date(e.target.value);
			const utcTime = toUTCDate(date);
			if (e.target.name === 'from') {
				setIsFromValue(true);
				config.setFromValue(utcTime);
			} else {
				setIsToValue(true);
				config.setToValue(utcTime);
			}
		} else if (e.target.name === 'from') {
			setIsFromValue(false);
		} else {
			setIsToValue(false);
		}
	};

	return (
		<div className='filter-row'>
			<label
				htmlFor={fromId}
				className='filter-row__label'>
				{config.label}
			</label>
			<MaskedInput id={fromId}
						 className={fromInputClasses}
						 value={formatTimestampValue(config.fromValue)}
						 mask={inputMask}
						 onBlur={onInputBlur}
						 placeholder="MM/DD/YYYY, 00:00"
						 keepCharPositions={true}
						 pipe={validPipe}
						 name='from'/>
			<label htmlFor={toId}> to </label>
			<MaskedInput id={toId}
						 className={toInputClasses}
						 value={formatTimestampValue(config.toValue)}
						 mask={inputMask}
						 onBlur={onInputBlur}
						 placeholder="MM/DD/YYYY, 00:00"
						 keepCharPositions={true}
						 pipe={validPipe}
						 name='to'/>
		</div>
	);
}

function StringRow({ config }: { config: FilterRowStringConfig }) {
	return (
		<div className="filter-row">
			<label className="filter-row__label" htmlFor={config.id}>
				{config.label}
			</label>
			<input
				type="text"
				className="filter-row__input"
				id={config.id}
				value={config.value}
				onChange={e => config.setValue(e.target.value)}/>
		</div>
	);
}

function MultipleStringRow({ config }: { config: FilterRowMultipleStringsConfig }) {
	const input = React.useRef<HTMLInputElement>();

	React.useEffect(() => {
		input.current?.focus();
	}, []);

	const valueBubbleOnChangeFor = (index: number) => (nextValue: string) => {
		config.setValues(replaceByIndex(config.values, index, nextValue));
	};

	const valueBubbleOnRemoveFor = (index: number) => () => {
		config.setValues(removeByIndex(config.values, index));
	};

	const inputOnRemove = () => {
		const { values, setCurrentValue, setValues } = config;
		if (values.length === 0) {
			return;
		}

		const lastValue = values[values.length - 1];
		const restValues = values.slice(0, values.length - 1);

		setCurrentValue(lastValue);
		setValues(restValues);
	};

	const inputOnSubmit = (nextValue: string) => {
		const { values, setValues } = config;
		if (values.length > 0) {
			setValues([...values, nextValue]);
			return;
		}

		config.setValues([...values, nextValue]);
	};

	return (
		<div className="filter-row">
			<label className="filter-row__label" htmlFor={config.id}>
				{config.label}
			</label>
			<div className="filter-row__multiple-values">
				{config.values.map((value, index) => (
					<React.Fragment key={index}>
						<Bubble
							className="filter__bubble"
							value={value}
							onSubmit={valueBubbleOnChangeFor(index)}
							onRemove={valueBubbleOnRemoveFor(index)}
						/>
						<span>or</span>
					</React.Fragment>
				))}
				<AutocompleteInput
					ref={input}
					className="filter-row__input filter-row__multiple-values-input"
					value={config.currentValue}
					onSubmit={inputOnSubmit}
					onRemove={inputOnRemove}
					autoresize={false}
					autocomplete={null}
					datalistKey={`autocomplete-${1}`}
				/>
			</div>
		</div>
	);
}

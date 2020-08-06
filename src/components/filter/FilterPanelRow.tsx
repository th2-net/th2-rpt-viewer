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
import moment from 'moment';
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
import FilterDatetimeInput from './FilterDatetimeInput';

interface Props {
	rowConfig: FilterRowConfig;
}

export const TIME_MASK = 'YYYY-MM-DD HH:mm:ss:SSS';

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
	const inputMask = [/\d/, /\d/, /\d/, /\d/, '-',
		/\d/, /\d/, '-', /\d/, /\d/, ' ', /\d/, /\d/, ':',
		/\d/, /\d/, ':', /\d/, /\d/, '.', /\d/, /\d/, /\d/];
	const [isFromInputValid, setIsFromInputValid] = React.useState(config.fromValue !== null);
	const [isToInputValid, setIsToInputValid] = React.useState(config.toValue !== null);

	const fromInputClasses = createBemElement('filter-row', 'input', isFromInputValid ? 'valid' : null);
	const toInputClasses = createBemElement('filter-row', 'input', isToInputValid ? 'valid' : null);

	const validPipe = (maskedValue: string): string | false => {
		if (isCorrectDate(maskedValue)) {
			return maskedValue;
		}
		return false;
	};

	const isCorrectDate = (maskedValue: string): boolean => {
		const value = maskedValue.substr(0, 4).replace(/__/g, '01').replace(/_/g, '0')
		+ maskedValue.substr(4, 6)
			.replace(/__/g, '01')
			.replace(/(?<=1)_/g, '0')
			.replace(/(?<=0)_/g, '1')
			.replace(/_/g, '0')
		+ maskedValue.substring(10).replace(/_/g, '0');
		const date = moment(value, TIME_MASK);
		return date.isValid()
			&& date.isBefore(moment().utc().subtract((moment().utcOffset() / 60), 'hour'));
	};

	const onInputBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (isCorrectDate(e.target.value) && !e.target.value.includes('_')) {
			const date = new Date(e.target.value);
			const utcTime = toUTCDate(date);
			if (e.target.name === 'from') {
				setIsFromInputValid(true);
				config.setFromValue(utcTime);
			} else {
				setIsToInputValid(true);
				config.setToValue(utcTime);
			}
		} else if (e.target.name === 'from') {
			setIsFromInputValid(false);
		} else {
			setIsToInputValid(false);
		}
	};

	const setTimeOffset = (minutes: number) => {
		config.setFromValue(Date.now() - minutes * 60000);
		config.setToValue(Date.now());
	};

	return (
		<>
			<div className='filter-row'>
				<label
					htmlFor={fromId}
					className='filter-row__label'>
					{config.label}
				</label>
				<FilterDatetimeInput id={fromId}
							 className={fromInputClasses}
							 value={config.fromValue}
							 mask={inputMask}
							 onBlur={onInputBlur}
							 pipe={validPipe}
							 name='from'
							 config={config}/>
				<label
					htmlFor={toId}
					className='filter-row__to-label'
				>to</label>
				<FilterDatetimeInput id={toId}
							 className={toInputClasses}
							 value={config.toValue}
							 mask={inputMask}
							 onBlur={onInputBlur}
							 pipe={validPipe}
							 name='to'
							 config={config}/>
			</div>
			<div className="filter-time-controls">
				<span
					className="filter-time-control"
					onClick={setTimeOffset.bind(null, 15)}>last 15 minutes</span>
				<span
					className="filter-time-control"
					onClick={setTimeOffset.bind(null, 60)}>last hour</span>
				<span
					className="filter-time-control"
					onClick={setTimeOffset.bind(null, (60 * 24))}>last day</span>
			</div>
		</>
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
					autocomplete={config.autocompleteList}
					datalistKey={`autocomplete-${1}`}
				/>
			</div>
		</div>
	);
}

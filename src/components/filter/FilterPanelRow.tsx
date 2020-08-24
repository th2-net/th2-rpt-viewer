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
import {
	FilterRowConfig,
	FilterRowDatetimeRangeConfig,
	FilterRowMultipleStringsConfig,
	FilterRowStringConfig,
	DateTimeInputType,
} from '../../models/filter/FilterInputs';
import Bubble from '../util/Bubble';
import AutocompleteInput from '../util/AutocompleteInput';
import { removeByIndex, replaceByIndex } from '../../helpers/array';
import DateTimeInput from './date-time-inputs/DateTimeInput';

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
	const renderInput = (inputConfig: DateTimeInputType) => [
		inputConfig.label
		&& <label
			key={`${inputConfig.id}-label`}
			htmlFor={inputConfig.id}
			className={inputConfig.labelClassName}>
			{inputConfig.label}
		</label>,
		<DateTimeInput
			{...inputConfig}
			inputConfig={inputConfig}
			key={inputConfig.id}
		/>,
	];

	return (
		<>
			<div className='filter-row'>
				{
					config.inputs.map((inputConfig: DateTimeInputType) => renderInput(inputConfig))
				}
			</div>
			<div className="filter-time-controls">
				{
					config.timeShortcuts.map(({ label, onClick }) => (
						<span
							key={label}
							className="filter-time-control"
							onClick={onClick}>
							{label}
						</span>
					))
				}
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
		return () => {
			const inputValue = input.current?.value;
			if (inputValue && inputValue.trim()) {
				inputOnSubmit(inputValue);
			}
		};
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

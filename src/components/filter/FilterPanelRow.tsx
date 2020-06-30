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
} from './FilterPanel';
import Bubble from '../util/Bubble';
import AutocompleteInput from '../util/AutocompleteInput';
import { removeByIndex, replaceByIndex } from '../../helpers/array';

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

	const formatTimestampValue = (timestamp: number | null) => {
		if (timestamp == null) {
			return '';
		}

		const date = new Date(timestamp);
		return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 16);
	};

	return (
		<div className='filter-row'>
			<label
				htmlFor={fromId}
				className='filter-row__label'>
				{config.label}
			</label>
			<input id={fromId}
				   className='filter-row__datetime-input'
				   type='datetime-local'
				   value={formatTimestampValue(config.fromValue)}
				   onChange={e => config.setFromValue(new Date(e.target.value).getTime())}/>
			<label htmlFor={toId}> to </label>
			<input id={toId}
				   className='filter-row__datetime-input'
				   type='datetime-local'
				   value={formatTimestampValue(config.toValue)}
				   onChange={e => config.setToValue(new Date(e.target.value).getTime())}/>
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

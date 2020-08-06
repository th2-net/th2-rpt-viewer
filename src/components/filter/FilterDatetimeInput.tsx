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

import React from 'react';
import MaskedInput from 'react-text-mask';
import FilterDatetimePicker from './FIlterDatetimePicker';
import { FilterRowDatetimeRangeConfig } from './FilterPanel';
import { TIME_MASK } from './FilterPanelRow';
import { formatTimestampValue, toUTCDate } from '../../helpers/date';

interface FilterDatetimeInputProps {
	id: string;
	className: string;
	value: number | null;
	mask: (string | RegExp)[];
	onBlur: (e: React.ChangeEvent<HTMLInputElement>) => void;
	pipe: (maskedValue: string) => string | false;
	name: string;
	config: FilterRowDatetimeRangeConfig;
}

interface State {
	showPicker: boolean;
	inputValue: string;
}

export default class FilterDatetimeInput extends React.Component<FilterDatetimeInputProps, State> {
	private inputRef = React.createRef<MaskedInput>();

	state: State = {
		showPicker: false,
		inputValue: formatTimestampValue(this.props.value, TIME_MASK),
	};

	componentWillUnmount() {
		if (this.state.inputValue && !this.state.inputValue.includes('_')) {
			const date = new Date(this.state.inputValue);
			const utcTime = toUTCDate(date);
			if (this.props.name === 'from') {
				this.props.config.setFromValue(utcTime);
			} else {
				this.props.config.setToValue(utcTime);
			}
		}
	}

	openPicker = () => {
		this.setState({
			showPicker: true,
		});
	};

	inputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({
			inputValue: e.target.value,
		});
	};

	render = () => (
		<>
			<MaskedInput
				ref={this.inputRef}
				id={this.props.id}
				className={this.props.className}
				mask={this.props.mask}
				pipe={this.props.pipe}
				onBlur={this.props.onBlur}
				onFocus={this.openPicker}
				onChange={this.inputChangeHandler}
				value={formatTimestampValue(this.props.value, TIME_MASK)}
				placeholder="YYYY-MM-DD 00:00:00.000"
				keepCharPositions={true}
				autoComplete='off'
				name={this.props.name}
			/>
			{
				this.state.showPicker && (
					<FilterDatetimePicker
						value={this.props.value}
						config={this.props.config}
						name={this.props.name}
						left={
							this.inputRef.current?.inputElement.offsetLeft
						}
						top={
							this.inputRef.current?.inputElement ? (
								this.inputRef.current.inputElement.offsetTop
								+ this.inputRef.current.inputElement.clientHeight + 10
							) : undefined
						}
						onClose={() => { this.setState({ showPicker: false }); }}/>
				)
			}
		</>
	);
}

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
import moment from 'moment';
import FilterDatetimePicker from './FIlterDatetimePicker';
import { FilterRowDatetimeRangeConfig } from './FilterPanel';
import { TIME_MASK } from './FilterPanelRow';

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
}

export default class FilterDatetimeInput extends React.Component<FilterDatetimeInputProps, State> {
	state: State = {
		showPicker: false,
	};

	openPicker = () => {
		this.setState({
			showPicker: true,
		});
	};

	formatTimestampValue = (timestamp: number | null) => {
		if (timestamp == null) {
			return '';
		}

		const date = new Date(timestamp);
		const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
		return moment(utcDate).format(TIME_MASK);
	};

	render = () => (
		<div
			className='filter-datetime-input-wrapper'>
			<MaskedInput
				id={this.props.id}
				className={this.props.className}
				mask={this.props.mask}
				onBlur={this.props.onBlur}
				pipe={this.props.pipe}
				onFocus={this.openPicker}
				value={this.formatTimestampValue(this.props.value)}
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
						onClose={() => { this.setState({ showPicker: false }); }}/>
				)
			}
		</div>
	);
}

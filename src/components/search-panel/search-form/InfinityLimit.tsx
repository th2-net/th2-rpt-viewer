/** ****************************************************************************
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
 * limitations under the License.
 ***************************************************************************** */

import React from 'react';

export type InfinityLimitConfig = {
	value: string;
	setValue: (value: string) => void;
	disabled: boolean;
};

const InfinityLimit = ({ value, setValue, disabled }: InfinityLimitConfig) => {
	return (
		<div className='search-infinity-limit'>
			<span className='search-infinity-limit__label'>Note: Limit is </span>
			<input
				type='text'
				className='search-infinity-limit__input'
				id='search-infinity-limit'
				value={value}
				onChange={e => setValue(e.target.value)}
				disabled={disabled}
			/>
			<span className='search-infinity-limit__label'> days</span>
		</div>
	);
};

export default InfinityLimit;
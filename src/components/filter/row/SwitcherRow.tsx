/** *****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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

import { ToggleButtonGroup, ToggleButton } from 'components/buttons/ToggleButton';
import { StatusIcon } from 'components/icons/StatusIcon';
import { EventStatus } from 'modules/events/models/Status';
import { createStyleSelector } from '../../../helpers/styleCreators';
import { FilterRowSwitcherConfig } from '../../../models/filter/FilterInputs';

const icons: Record<string, JSX.Element> = {
	passed: <StatusIcon status={EventStatus.PASSED} />,
	failed: <StatusIcon status={EventStatus.FAILED} />,
};

const SwitcherRow = ({ config }: { config: FilterRowSwitcherConfig }) => {
	const { value, setValue, options, disabled, defaultValue } = config;

	const setType = (type: string) => {
		if (!disabled) {
			setValue(type);
		}
	};

	const labelClassName = createStyleSelector(
		'filter-row__label',
		config.label === 'Status' ? 'status' : null,
	);

	const selectedValue = value || defaultValue;

	return (
		<div className='search-type-switcher'>
			{config.label && (
				<label className={labelClassName} htmlFor={config.id}>
					{config.label}
				</label>
			)}
			<ToggleButtonGroup value={selectedValue} onChange={setType}>
				{options.map(option => (
					<ToggleButton key={option} value={option}>
						{icons[option.toLowerCase()]}
						{option}
					</ToggleButton>
				))}
			</ToggleButtonGroup>
		</div>
	);
};

export default SwitcherRow;

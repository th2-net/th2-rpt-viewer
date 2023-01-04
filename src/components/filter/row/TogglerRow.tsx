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
 * limitations under the License.
 ***************************************************************************** */

import clsx from 'clsx';
import { FilterRowTogglerConfig } from 'models/filter/FilterInputs';
import { AndIcon, IncludeIcon, StrictIcon } from 'components/icons/FilterTogglerIcon';
import { ButtonBase } from 'components/buttons/ButtonBase';
import 'styles/toggler.scss';

const icons: Record<string, () => JSX.Element> = {
	exclude: IncludeIcon,
	and: AndIcon,
	strict: StrictIcon,
};

const TogglerRow = ({ config }: { config: FilterRowTogglerConfig }) => {
	const { value, toggleValue, options, disabled } = config;

	const [firstLabel, secondLabel] = [options[0].split('-')[0], options[1].split('-')[0]];

	const onToggle = () => {
		if (!disabled) {
			toggleValue();
		}
	};

	const Icon = icons[firstLabel.toLowerCase()];

	return (
		<div className={clsx('toggler-row', { disabled })}>
			<ButtonBase onClick={onToggle} className={clsx('toggler-row__button', { active: value })}>
				{Icon && <Icon />}
			</ButtonBase>
			<p className='toggler-row__label'>{value ? firstLabel : secondLabel}</p>
		</div>
	);
};

export default TogglerRow;

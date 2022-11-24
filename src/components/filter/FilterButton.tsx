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

import { useRef } from 'react';
import clsx from 'clsx';
import { IconButton } from 'components/buttons/IconButton';
import { FilterIcon } from 'components/icons/FilterIcon';
import '../../styles/filter.scss';

interface Props {
	isFilterApplied: boolean;
	isLoading: boolean;
	isDisabled?: boolean;
	showFilter: boolean;
	setShowFilter: (isShown: boolean) => void;
}

const FilterButton = (props: Props) => {
	const { isFilterApplied, showFilter, setShowFilter, isDisabled = false } = props;

	const filterButtonRef = useRef<HTMLButtonElement>(null);

	function onClick() {
		if (!isDisabled) {
			setShowFilter(!showFilter);
		}
	}

	const filterButtonClass = clsx('filter__button', {
		disabled: isDisabled,
		applied: isFilterApplied && !isDisabled,
	});

	return (
		<IconButton className={filterButtonClass} ref={filterButtonRef} onClick={onClick}>
			<FilterIcon />
		</IconButton>
	);
};

export default FilterButton;

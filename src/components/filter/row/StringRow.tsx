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

import * as React from 'react';
import {
	createBemBlock,
	createBemElement,
	createStyleSelector,
} from '../../../helpers/styleCreators';
import { FilterRowStringConfig } from '../../../models/filter/FilterInputs';
import AutocompleteInput from '../../util/AutocompleteInput';

export default function StringFilterRow({ config }: { config: FilterRowStringConfig }) {
	const ref = React.useRef();
	const [autocompleteAnchor, setAutocompleteAnchor] = React.useState<HTMLDivElement>();

	const inputClassName = createBemElement(
		'filter-row',
		'input',
		config.value.length ? 'non-empty' : '',
	);
	const wrapperClassName = createBemBlock('filter-row', config.wrapperClassName || null);
	const labelClassName = createStyleSelector('filter-row__label', config.labelClassName || null);

	React.useLayoutEffect(() => {
		setAutocompleteAnchor(ref.current || undefined);
	}, [setAutocompleteAnchor]);

	return (
		<div className={wrapperClassName}>
			{config.label && (
				<label className={labelClassName} htmlFor={config.id}>
					{config.label}
				</label>
			)}
			{config.autocompleteList ? (
				<AutocompleteInput
					anchor={autocompleteAnchor}
					autoresize={false}
					className={inputClassName}
					ref={ref}
					autocomplete={config.autocompleteList}
					value={config.value}
					setValue={config.setValue}
					onSubmit={config.setValue}
				/>
			) : (
				<input
					type='text'
					className={inputClassName}
					id={config.id}
					autoComplete='off'
					disabled={config.disabled}
					value={config.value}
					onChange={e => config.setValue(e.target.value)}
				/>
			)}
		</div>
	);
}

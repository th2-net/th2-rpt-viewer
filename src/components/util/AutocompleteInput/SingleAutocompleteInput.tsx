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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import { AutocompleteList } from './AutocompleteList';

interface Props extends React.HTMLAttributes<HTMLInputElement> {
	value: string;
	setValue: (v: string) => void;
	autocomplete: string[] | null;
	autocompleteClassName?: string;
	anchor?: HTMLElement;
}

const SingleAutocompleteInput = React.forwardRef(
	(props: Props, ref: React.Ref<HTMLInputElement>) => {
		const { value, setValue, autocomplete, autocompleteClassName, anchor, ...restProps } = props;

		const autocompleteListRef = React.useRef<HTMLDivElement>(null);

		const onChange: React.ChangeEventHandler<HTMLInputElement> = e => {
			setValue(e.target.value);
		};

		const onAutocompleteSelect = (selectedOption: string) => {
			setValue(selectedOption);
		};

		const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
			value,
			onChange,
			...restProps,
		};

		return (
			<React.Fragment>
				<input {...inputProps} ref={ref} />
				{autocomplete && autocomplete.length > 0 && (
					<AutocompleteList
						className={autocompleteClassName}
						ref={autocompleteListRef}
						items={autocomplete}
						value={value.trim()}
						anchor={anchor || null}
						onSelect={onAutocompleteSelect}
					/>
				)}
			</React.Fragment>
		);
	},
);

SingleAutocompleteInput.displayName = 'SingleAutocompleteInput';

export default SingleAutocompleteInput;

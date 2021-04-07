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
import AutocompleteInput from '../util/AutocompleteInput';

interface SessionEditorProps {
	value: string;
	setValue: (v: string) => void;
	sessions: string[];
	onSubmit?: () => void;
	autofocus?: boolean;
}

const SessionEditor: React.FC<SessionEditorProps> = ({
	value,
	setValue,
	sessions,
	onSubmit,
	autofocus,
}) => {
	const ref = React.useRef<HTMLInputElement>(null);
	const [anchor, setAnchor] = React.useState<HTMLInputElement>();
	React.useLayoutEffect(() => {
		setAnchor(ref.current || undefined);
	}, [setAnchor]);
	return (
		<AutocompleteInput
			anchor={anchor}
			autoresize={false}
			placeholder='New session'
			className='session-input'
			ref={ref}
			value={value}
			onSubmit={v => {
				setValue(v);
				if (onSubmit) {
					onSubmit();
				}
			}}
			autofocus={autofocus}
			autocomplete={sessions}
			autocompleteClassName='rules-autocomplete'
			datalistKey='session-input'
		/>
	);
};

export default SessionEditor;

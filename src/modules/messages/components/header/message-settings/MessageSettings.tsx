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

import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useOutsideClickListener } from 'hooks/useOutsideClickListener';
import { IconButton } from 'components/buttons/IconButton';
import { ToggleButtonGroup, ToggleButton } from 'components/buttons/ToggleButton';
import { SettingsIcon } from 'components/icons/SettingsIcon';
import { ModalPortal } from 'components/util/Portal';
import { DisplayRules as DisplayRulesComponent } from './display-rules-settings/DisplayRules';
import { BodySortRules as BodySortRulesComponent } from './body-sort-settings/BodySortRules';
import 'styles/messages-view-configurator.scss';

enum MessagesSettingsViews {
	DisplayRules = 'display-rules',
	BodySortRules = 'body-sort-rules',
}

const MessagesSettings = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [mode, setMode] = useState<MessagesSettingsViews>(MessagesSettingsViews.DisplayRules);

	const modalRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		const isFromAutocomplete = Boolean((e.target as HTMLElement).closest('.rules-autocomplete'));
		const isFromSelect = Boolean((e.target as HTMLElement).closest('.rules-select-options-list'));
		if (
			!buttonRef.current?.contains(e.target as HTMLElement) &&
			!isFromAutocomplete &&
			!isFromSelect
		) {
			setIsOpen(false);
		}
	});

	const offsetTop = buttonRef.current?.getBoundingClientRect().top;
	const offsetRight = buttonRef.current?.getBoundingClientRect().left;

	return (
		<>
			<IconButton ref={buttonRef} onClick={() => setIsOpen(open => !open)}>
				<SettingsIcon size={24} />
			</IconButton>
			<ModalPortal
				isOpen={isOpen}
				ref={modalRef}
				style={{
					position: 'absolute',
					width: '380px',
					top: `calc(35px + ${offsetTop}px)`,
					right: `calc(100% - ${offsetRight}px - 14px)`,
					zIndex: 500,
				}}>
				<div className='message-settings'>
					<div className='message-settings__body'>
						{mode === MessagesSettingsViews.DisplayRules ? (
							<DisplayRulesComponent />
						) : (
							<BodySortRulesComponent />
						)}
					</div>
					<ToggleButtonGroup value={mode} onChange={setMode} className='message-settings__togglers'>
						<ToggleButton value={MessagesSettingsViews.DisplayRules}>Display rules</ToggleButton>
						<ToggleButton value={MessagesSettingsViews.BodySortRules}>Body sort</ToggleButton>
					</ToggleButtonGroup>
				</div>
			</ModalPortal>
		</>
	);
};

export default observer(MessagesSettings);

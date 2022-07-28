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

// TODO: fix component once search is migrated to sse

import * as React from 'react';
import { raf } from 'helpers/raf';
import { createBemElement, createStyleSelector } from 'helpers/styleCreators';
import { useOutsideClickListener } from 'hooks/useOutsideClickListener';
import { ModalPortal } from 'components/util/Portal';
import SearchInput from './SearchInput';
import KeyCodes from '../../../../models/util/KeyCodes';

const PANEL_WIDTH = 540;

interface Props {
	isDisabled?: boolean;
}

function EventSearchPanel({ isDisabled = false }: Props) {
	const [showSearch, setShowSearch] = React.useState(false);
	const searchBaseRef = React.useRef<HTMLDivElement>(null);
	const searchButtonRef = React.useRef<HTMLDivElement>(null);

	React.useLayoutEffect(() => {
		if (showSearch) {
			raf(() => {
				if (searchBaseRef.current && searchButtonRef.current) {
					const clientWidth = document.documentElement.clientWidth;
					const { left, bottom } = searchButtonRef.current.getBoundingClientRect();

					searchBaseRef.current.style.right = `${Math.max(clientWidth - left - PANEL_WIDTH, 10)}px`;
					searchBaseRef.current.style.top = `${bottom}px`;
					searchBaseRef.current.style.width = `${PANEL_WIDTH}px`;
					searchBaseRef.current.style.borderTopLeftRadius =
						clientWidth - left - PANEL_WIDTH < 10 ? '5px' : '';
				}
			}, 2);
		}
	}, [showSearch]);

	const handleKeyDown = React.useCallback(
		(e: KeyboardEvent) => {
			if (e.keyCode === KeyCodes.F3 || (e.keyCode === KeyCodes.F && e.ctrlKey)) {
				// cancel browser search opening
				if (!isDisabled) {
					e.preventDefault();
					setShowSearch(true);
				}
			}
		},
		[isDisabled],
	);

	React.useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	useOutsideClickListener(searchBaseRef, (e: MouseEvent) => {
		if (e.target instanceof Element && !searchButtonRef.current?.contains(e.target)) {
			setShowSearch(false);
		}
	});

	const searchWrapperClass = createStyleSelector('search-wrapper', showSearch ? 'active' : null);

	const searchTitleClass = createBemElement('search', 'title', showSearch ? 'active' : null);

	const searchIconClass = createBemElement('search', 'icon', showSearch ? 'active' : null);

	const searchButtonClass = createBemElement('search', 'button', showSearch ? 'active' : null);

	function handleSearchButtonClick() {
		setShowSearch(isSearchPanelShown => !isSearchPanelShown);
	}

	return (
		<div className={searchWrapperClass}>
			<div className={searchButtonClass} ref={searchButtonRef} onClick={handleSearchButtonClick}>
				<div className={searchIconClass} />
				<div className={searchTitleClass}>Search</div>
			</div>
			<ModalPortal isOpen={showSearch}>
				<div className='search' ref={searchBaseRef}>
					<SearchInput disabled={isDisabled} isActive={showSearch} />
				</div>
			</ModalPortal>
		</div>
	);
}

export default React.memo(EventSearchPanel);

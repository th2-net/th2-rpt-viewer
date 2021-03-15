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
import ResizeObserver from 'resize-observer-polyfill';
import { IndexLocationWithAlign, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import KeyCodes from '../../../util/KeyCodes';
import { ModalPortal } from '../Portal';
import { useOutsideClickListener } from '../../../hooks';
import { createBemElement, createStyleSelector } from '../../../helpers/styleCreators';

const AUTOCOMPLETE_OPTION_HEIGHT = 22;
const RENDERED_OPTIONS_COUNT = 12;

interface AutocompleteListProps {
	items: string[];
	value: string;
	anchor: HTMLElement | null;
	onSelect?: (value: string) => void;
}

export const AutocompleteList = React.forwardRef<HTMLDivElement, AutocompleteListProps>(
	(props, ref) => {
		const { items, value, anchor, onSelect } = props;
		const [isOpen, setIsOpen] = React.useState(false);
		const [focusedOption, setFocusedOption] = React.useState<string | null>(null);

		const rootRef = React.useRef<HTMLDivElement>(null);
		const virtuosoRef = React.useRef<VirtuosoHandle | null>(null);

		const anchorResizerObserver = React.useRef(
			new ResizeObserver((entries: ResizeObserverEntry[]) => {
				const anchorEl = entries[0]?.target;
				if (anchorEl && rootRef.current) {
					const { bottom, left, right } = anchorEl.getBoundingClientRect();
					rootRef.current.style.width = `${right - left}px`;
					rootRef.current.style.left = `${left}px`;
					rootRef.current.style.top = `${bottom}px`;
				}
			}),
		);

		React.useEffect(() => {
			if (anchor) {
				anchorResizerObserver.current.observe(anchor);
			}

			return () => {
				if (anchor) {
					anchorResizerObserver.current.unobserve(anchor);
				}
			};
		}, [anchor]);

		const list = React.useMemo(() => {
			if (!value) return items;
			return items.filter(item => item.toLowerCase().includes(value.toLowerCase()));
		}, [value, items]);

		const onClickOutside = React.useCallback(
			(e: MouseEvent) => {
				if (
					!anchor?.contains(e.target as HTMLElement) &&
					!rootRef.current?.contains(e.target as HTMLElement)
				) {
					setIsOpen(false);
				}
			},
			[anchor],
		);

		useOutsideClickListener(rootRef, onClickOutside);

		React.useEffect(() => {
			setFocusedOption(list[0] || null);
			if (list.length > 0) {
				virtuosoRef.current?.scrollToIndex(0);
			}
		}, [list]);

		const scrollToOption = React.useCallback(
			(location: IndexLocationWithAlign) => {
				const { index, align } = location;
				const optionEl = rootRef.current?.querySelector(`*[data-index="${index}"]`);

				if (!optionEl && location.index < list.length) {
					virtuosoRef.current?.scrollToIndex({ index, align });
					return;
				}

				if (optionEl && rootRef.current) {
					const { top, bottom } = optionEl.getBoundingClientRect();
					const { top: rootTop, bottom: rootBottom } = rootRef.current.getBoundingClientRect();

					if (top < rootTop || bottom > rootBottom) {
						virtuosoRef.current?.scrollToIndex({ index, align });
					}
				}
			},
			[list],
		);

		const handleKeyDown = React.useCallback(
			(event: KeyboardEvent) => {
				if (event.keyCode === KeyCodes.UP) {
					if (!focusedOption) {
						setFocusedOption(list[list.length - 1] || null);
					} else {
						const prevIndex = list.indexOf(focusedOption) - 1;
						const nextOption = list[prevIndex];
						if (nextOption) {
							setFocusedOption(nextOption);
							scrollToOption({ index: prevIndex, align: 'start' });
						}
					}
				}
				if (event.keyCode === KeyCodes.DOWN) {
					if (!focusedOption) {
						setFocusedOption(list[0] || null);
					} else {
						const nextIndex = list.indexOf(focusedOption) + 1;
						const nextOption = list[nextIndex];
						if (nextOption) {
							setFocusedOption(nextOption);
							scrollToOption({ index: nextIndex, align: 'end' });
						}
					}
				}

				if (event.keyCode === KeyCodes.ENTER) {
					if (focusedOption) {
						handleSelect(focusedOption);
					}
				}

				if (event.keyCode === KeyCodes.TAB) {
					event.preventDefault();
					let nextIndex = focusedOption ? list.indexOf(focusedOption) + 1 : 0;
					if (nextIndex >= list.length) {
						nextIndex = 0;
					}
					const nextOption = list[nextIndex];
					setFocusedOption(nextOption || null);
					scrollToOption({ index: nextIndex, align: nextIndex === 0 ? 'start' : 'end' });
				}
			},
			[focusedOption, setFocusedOption, isOpen, list, scrollToOption],
		);

		React.useEffect(() => {
			if (isOpen) {
				document.addEventListener('keydown', handleKeyDown);
			}
			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}, [handleKeyDown]);

		React.useEffect(() => {
			const showAutocomplete = Boolean(value && list.length);

			if (showAutocomplete !== isOpen) {
				setIsOpen(showAutocomplete);
			}
		}, [value, list, isOpen]);

		React.useEffect(() => {
			if (isOpen) {
				setFocusedOption(list[0] || null);
				if (list.length > 0) {
					virtuosoRef.current?.scrollToIndex(0);
				}
			}
		}, [isOpen]);

		function handleSelect(item: string) {
			if (onSelect) {
				onSelect(item);
			}
		}

		const renderAutocompleteOption = React.useCallback(
			(index: number) => {
				const option = list[index];
				return (
					<div
						className={createBemElement(
							'autocomplete-list',
							'option',
							focusedOption === option ? 'active' : null,
						)}
						onClick={() => handleSelect(option)}>
						{option}
					</div>
				);
			},
			[list, focusedOption],
		);

		const listHeight = Math.min(
			RENDERED_OPTIONS_COUNT * AUTOCOMPLETE_OPTION_HEIGHT,
			list.length * AUTOCOMPLETE_OPTION_HEIGHT,
		);

		return (
			<ModalPortal isOpen={isOpen} closeDelay={150} ref={ref}>
				<div
					className={createStyleSelector('autocomplete-list', isOpen ? 'opened' : 'closed')}
					style={{ height: `${listHeight}px` }}
					ref={rootRef}>
					<Virtuoso
						ref={virtuosoRef}
						totalCount={list.length}
						overscan={0}
						itemContent={renderAutocompleteOption}
						className='autocomplete-list__options'
					/>
				</div>
			</ModalPortal>
		);
	},
);

AutocompleteList.displayName = 'AutocompleteList';

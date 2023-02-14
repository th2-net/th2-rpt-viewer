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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import AutosizeInput from 'react-input-autosize';
import KeyCodes from '../../util/KeyCodes';
import SearchToken from '../../models/search/SearchToken';
import Bubble from '../util/Bubble';
import { nextCyclicItem, removeByIndex, replaceByIndex } from '../../helpers/array';
import { raf } from '../../helpers/raf';
import { useWorkspaceEventStore } from '../../hooks/useEventWindowStore';
import { createSearchToken } from '../../helpers/search/createSearchToken';
import '../../styles/search.scss';

export const REACTIVE_SEARCH_DELAY = 500;
const INPUT_PLACEHOLDER = 'Use Space to separate different words & Tab to finish';

export const COLORS = ['#E69900', '#FF5500', '#1F66AD', '#45A155', '#987DB3'];

interface StateProps {
	searchTokens: SearchToken[];
	currentIndex: number | null;
	resultsCount: number;
	isLoading: boolean;
	value: string;
}

interface DispatchProps {
	updateSearchTokens: (searchValues: SearchToken[]) => void;
	nextSearchResult: () => void;
	prevSearchResult: () => void;
	clear: () => void;
	setValue: (value: string) => void;
}

export interface Props extends StateProps, DispatchProps {
	disabled: boolean;
	isActive: boolean;
}

export class SearchInputBase extends React.PureComponent<Props> {
	private inputElement: React.MutableRefObject<HTMLInputElement | null> = React.createRef();

	private root = React.createRef<HTMLDivElement>();

	constructor(props: Props) {
		super(props);
		this.state = { isBubbleEditing: false, isReactFunctioning: true };
	}

	componentDidUpdate(prevProps: Props) {
		if (this.props.isActive && !prevProps.isActive) {
			this.focus();
		}
	}

	focus() {
		raf(() => this.inputElement.current?.focus(), 3);
	}

	render() {
		const {
			currentIndex,
			resultsCount,
			prevSearchResult,
			nextSearchResult,
			searchTokens,
			isLoading,
			value,
		} = this.props;
		const notActiveTokens = searchTokens.filter(searchToken => !searchToken.isActive);
		const activeTokens = searchTokens.find(searchToken => searchToken.isActive);

		const showControls = resultsCount > 0;

		return (
			<div className='search-field-wrapper'>
				<div className='search-field' ref={this.root} onMouseDown={this.onMouseDown}>
					<React.Fragment>
						<div className='search-field__child-wrapper' onMouseDown={this.onMouseDown}>
							{notActiveTokens.map(({ color, pattern }, index) => (
								<Bubble
									key={index}
									className='search-bubble'
									size='small'
									removeIconType='white'
									submitKeyCodes={[KeyCodes.ENTER]}
									value={pattern}
									style={{ backgroundColor: color, color: '#FFF' }}
									onSubmit={this.bubbleOnChangeFor(index)}
									onRemove={this.bubbleOnRemoveFor(index)}
									setIsBubbleEditing={bool => this.setState({ isBubbleEditing: bool })}
									isBubbleEditing={false}
								/>
							))}
							<AutosizeInput
								inputClassName='search-field__input'
								className='search-field__input-wrapper'
								inputRef={ref => (this.inputElement.current = ref)}
								inputStyle={
									value.length > 0
										? {
												backgroundColor: activeTokens?.color ?? this.getNextColor(),
												color: '#FFF',
										  }
										: undefined
								}
								placeholder={
									notActiveTokens.length < 1 && value.length < 1 ? INPUT_PLACEHOLDER : undefined
								}
								type='text'
								spellCheck={false}
								value={value}
								onChange={this.inputOnChange}
								onKeyDown={this.onKeyDown}
								autoFocus={true}
								onMouseDown={this.onMouseDown}
							/>
						</div>
						<div className='search-field__search-controls search-controls'>
							<div className='search-controls__clear-button' onClick={this.clear} />
							{isLoading ? (
								<div className='search-controls__loader' />
							) : showControls ? (
								<span className='search-controls__counter'>
									{currentIndex !== null ? currentIndex + 1 : 0} of {resultsCount}
								</span>
							) : null}
							{showControls && !isLoading ? (
								<>
									<div className='search-controls__prev' onClick={prevSearchResult} />
									<div className='search-controls__next' onClick={nextSearchResult} />
								</>
							) : null}
						</div>
					</React.Fragment>
				</div>
			</div>
		);
	}

	private onMouseDown = (e: React.MouseEvent) => {
		if (e.target === this.root.current) {
			e.preventDefault();
			this.focus();
		}
	};

	private onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.keyCode === KeyCodes.ENTER && e.shiftKey) {
			this.props.prevSearchResult();
			return;
		}

		if (e.keyCode === KeyCodes.ENTER) {
			this.props.nextSearchResult();
			return;
		}

		if (e.keyCode === KeyCodes.ESCAPE) {
			this.clear();
			return;
		}

		if (
			e.keyCode === KeyCodes.BACKSPACE &&
			this.props.value === '' &&
			this.props.searchTokens.length > 0
		) {
			// we should check is the last item active or not and remove it
			const nextTokens = this.props.searchTokens[this.props.searchTokens.length - 1].isActive
				? this.props.searchTokens.slice(0, -1)
				: [...this.props.searchTokens];

			if (nextTokens.length > 0) {
				const [lastItem, ...restItems] = nextTokens.reverse();

				this.props.updateSearchTokens([
					...restItems.reverse(),
					{
						...lastItem,
						isActive: true,
					},
				]);
				this.props.setValue(lastItem.pattern);
			} else {
				this.props.updateSearchTokens([]);
			}

			e.preventDefault();
		}

		if (e.keyCode === KeyCodes.TAB && e.currentTarget.value !== '') {
			e.preventDefault();
			if (e.ctrlKey) {
				this.props.setValue(`${this.props.value} `);
				return;
			}

			const [lastItem, ...restItems] = [...this.props.searchTokens].reverse();

			if (lastItem?.isActive) {
				this.props.updateSearchTokens([
					...restItems.reverse(),
					{
						...lastItem,
						isActive: false,
						pattern: e.currentTarget.value,
					},
				]);
			} else {
				this.props.updateSearchTokens([
					...this.props.searchTokens,
					this.createToken(e.currentTarget.value, undefined, false),
				]);
			}

			this.props.setValue('');
		}
	};

	private inputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const currentValue = e.target.value;

		this.props.setValue(currentValue.trimLeft());

		setTimeout(() => {
			if (this.props.value === currentValue) {
				// clear last active value
				if (currentValue === '') {
					this.props.updateSearchTokens(
						this.props.searchTokens.filter(({ isActive }) => !isActive),
					);

					return;
				}

				if (this.props.searchTokens.length === 0) {
					this.props.updateSearchTokens([this.createToken(this.props.value)]);
					return;
				}

				const activeItem = this.props.searchTokens.find(({ isActive }) => isActive);

				if (activeItem != null) {
					this.props.updateSearchTokens(
						replaceByIndex(
							this.props.searchTokens,
							this.props.searchTokens.indexOf(activeItem),
							this.createToken(this.props.value, activeItem.color),
						),
					);
					return;
				}

				this.props.updateSearchTokens([
					...this.props.searchTokens,
					this.createToken(this.props.value),
				]);
			}
		}, REACTIVE_SEARCH_DELAY);
	};

	private bubbleOnChangeFor = (index: number) => (nextValue: string) => {
		this.props.updateSearchTokens(
			replaceByIndex(
				this.props.searchTokens,
				index,
				this.createToken(nextValue, this.props.searchTokens[index].color, false),
			),
		);
	};

	private bubbleOnRemoveFor = (index: number) => () => {
		this.props.updateSearchTokens(removeByIndex(this.props.searchTokens, index));
	};

	private clear = () => {
		this.props.clear();
	};

	private createToken(value: string, color?: string, isActive = true): SearchToken {
		return createSearchToken(value.trim(), color ?? this.getNextColor(), true, isActive);
	}

	private getNextColor(): string {
		return this.props.searchTokens.length > 0
			? (nextCyclicItem(
					COLORS,
					this.props.searchTokens[this.props.searchTokens.length - 1].color,
			  ) as string)
			: COLORS[0];
	}
}

interface SearchInputProps {
	disabled: boolean;
	isActive: boolean;
}

const SearchInput = (props: SearchInputProps) => {
	const { searchStore } = useWorkspaceEventStore();

	return (
		<SearchInputBase
			searchTokens={searchStore.tokens}
			resultsCount={searchStore.results.length}
			currentIndex={searchStore.scrolledIndex}
			isLoading={searchStore.isLoading}
			updateSearchTokens={searchStore.updateTokens}
			nextSearchResult={searchStore.nextSearchResult}
			prevSearchResult={searchStore.prevSearchResult}
			clear={searchStore.clear}
			value={searchStore.inputValue}
			setValue={searchStore.setInputValue}
			{...props}
		/>
	);
};

export default observer(SearchInput);

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

import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	SearchInputBase,
	Props as SearchInputProps,
	REACTIVE_SEARCH_DELAY,
	COLORS,
} from '../../../components/search/SearchInput';
import SearchToken from '../../../models/search/SearchToken';
import { timer } from '../../util/timer';

/* eslint-disable @typescript-eslint/no-empty-function */

describe('[React] <SearchInput/>', () => {
	const defaultProps: SearchInputProps = {
		searchTokens: [],
		currentIndex: -1,
		resultsCount: 0,
		isLoading: false,
		updateSearchTokens: () => {},
		nextSearchResult: () => {},
		prevSearchResult: () => {},
		clear: () => {},
		disabled: false,
		isActive: false,
	};

	const searchTokens = [
		{
			pattern: 'token1',
			color: COLORS[0],
			isActive: false,
			isScrollable: false,
		},
		{
			pattern: 'token2',
			color: COLORS[0],
			isActive: false,
			isScrollable: false,
		},
	];

	test('Reactive delay test', done => {
		const updateMock = jest.fn();

		const { getByTestId } = render(
			<SearchInputBase {...defaultProps} updateSearchTokens={updateMock} isActive={false} />,
		);

		const searchWrapper = getByTestId('search-wrapper');
		userEvent.click(searchWrapper);

		const input = getByTestId('search');
		userEvent.type(input, 'test');
		expect(updateMock.mock.calls.length).toEqual(0);

		setTimeout(() => {
			expect(updateMock).toHaveBeenCalled();

			const tokens: SearchToken[] = updateMock.mock.calls[0][0];
			expect(tokens[0].pattern).toEqual('test');
			done();
		}, REACTIVE_SEARCH_DELAY);
	});

	test('Submit by SPACE key down', () => {
		const updateMock = jest.fn();

		const { getByTestId } = render(
			<SearchInputBase {...defaultProps} updateSearchTokens={updateMock} isActive={true} />,
		);

		const searchWrapper = getByTestId('search-wrapper');
		userEvent.click(searchWrapper);

		const input = getByTestId('search');
		userEvent.type(input, 'test');

		expect(updateMock).not.toHaveBeenCalled();

		userEvent.type(input, ' ');

		expect(updateMock).toHaveBeenCalled();

		const tokens: SearchToken[] = updateMock.mock.calls[0][0];
		expect(tokens[0]?.pattern).toEqual('test');
	});

	test('Submit by reactive delay, change input and after that submit by space', async () => {
		const updateMock = jest.fn();

		const { getByTestId } = render(
			<SearchInputBase {...defaultProps} updateSearchTokens={updateMock} isActive={true} />,
		);

		const searchWrapper = getByTestId('search-wrapper');
		userEvent.click(searchWrapper);

		const input = getByTestId('search');
		userEvent.type(input, 'test');

		expect(updateMock).not.toHaveBeenCalled();

		await timer(REACTIVE_SEARCH_DELAY);

		expect(updateMock).toHaveBeenCalled();
		const reactiveTokens: SearchToken[] = updateMock.mock.calls[0][0];
		expect(reactiveTokens[0]?.pattern).toEqual('test');
		expect(reactiveTokens[0]?.isActive).toEqual(true);

		userEvent.type(input, ' testsubmit ');

		expect(updateMock.mock.calls.length).toEqual(3);

		const submittedTokens: SearchToken[] = updateMock.mock.calls[2][0];

		expect(submittedTokens[0]?.pattern).toEqual('testsubmit');
		expect(submittedTokens[0]?.isActive).toEqual(false);
	});

	test('Renders predefined tokens on mount', async () => {
		const { getByTestId, findAllByTestId } = render(
			<SearchInputBase {...defaultProps} isActive={true} searchTokens={searchTokens} />,
		);

		const searchWrapper = getByTestId('search-wrapper');
		userEvent.click(searchWrapper);

		const renderedTokens = await findAllByTestId('bubble');
		expect(renderedTokens.length).toBe(searchTokens.length);
	});

	test('Clears input value on clear button click', async () => {
		const clearMock = jest.fn();
		const updateTokensMock = jest.fn();
		const { getByTestId } = render(
			<SearchInputBase
				{...defaultProps}
				isActive={true}
				searchTokens={searchTokens}
				clear={clearMock}
				updateSearchTokens={updateTokensMock}
			/>,
		);

		const searchWrapper = getByTestId('search-wrapper');
		userEvent.click(searchWrapper);

		const input = getByTestId('search');
		userEvent.type(input, 'token3');

		expect((input as HTMLInputElement).value).toBe('token3');

		const clearButton = getByTestId('clear-search-button');
		userEvent.click(clearButton);

		expect((input as HTMLInputElement).value).toBe('');
	});
});

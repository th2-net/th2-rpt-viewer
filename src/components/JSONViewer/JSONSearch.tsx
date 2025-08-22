/** ****************************************************************************
 * Copyright 2024-2025 Exactpro (Exactpro Systems Limited)
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

import React from 'react';
import { observer } from 'mobx-react-lite';
import { SearchInputBase } from '../search/SearchInput';
import SearchToken from '../../models/search/SearchToken';
import { useActiveWorkspace } from '../../hooks';
import { isJSONViewerWorkspaceStore } from '../../helpers/workspace';

const JSONSearch = () => {
	const activeWorkspace = useActiveWorkspace();
	const inputSearchRef = React.useRef<HTMLInputElement>(null);
	if (!isJSONViewerWorkspaceStore(activeWorkspace)) return <></>;
	const JSONViewerStore = activeWorkspace.JSONviewerStore;

	const readSearchFile = async (files: FileList) => {
		const file = files.item(0);
		if (!file) return;
		const fileContent = await file.text();
		JSONViewerStore.updateTokensFromText(fileContent);
	};

	return (
		<div className={'JSON-search-header'}>
			<button
				className='JSON-load-button'
				onClick={() => JSONViewerStore.toggleMode()}
				style={{ width: '120px' }}>
				Switch mode to {JSONViewerStore.isCompare ? 'table' : 'compare'}
			</button>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '5px',
				}}>
				<label htmlFor='chunk-size'>Chunk interval:</label>
				<input
					type='number'
					style={{
						border: '1px solid black',
						borderRadius: '5px',
						maxWidth: 50,
					}}
					value={JSONViewerStore.intervalSize}
					onChange={e => {
						e.preventDefault();
						JSONViewerStore.updateIntervalSize(Number(e.target.value));
					}}
				/>
				<select
					name='intervals'
					id='chunk-size'
					onChange={e => {
						e.preventDefault();
						JSONViewerStore.updateIntervalUnit(Number(e.target.value));
					}}
					value={JSONViewerStore.intervalUnit}>
					<option value={1}>millisec</option>
					<option value={1000}>sec</option>
					<option value={60000}>min</option>
				</select>
			</div>
			<div className='JSON-search-wrapper'>
				<SearchInputBase
					searchTokens={JSONViewerStore.tokens}
					resultsCount={0}
					currentIndex={JSONViewerStore.scrolledIndex}
					isLoading={false}
					updateSearchTokens={(nextTokens: SearchToken[]) =>
						JSONViewerStore.updateTokens(nextTokens)
					}
					nextSearchResult={JSONViewerStore.blankMethod}
					prevSearchResult={JSONViewerStore.blankMethod}
					clear={() => JSONViewerStore.clearSearchField()}
					value={JSONViewerStore.searchInputValue}
					setValue={(newValue: string) => JSONViewerStore.setInputValue(newValue)}
					disabled={true}
				/>
				<div
					className='import-button'
					onClick={() => inputSearchRef.current?.click()}
					title='Import Search'
				/>
				<div
					className='export-button'
					onClick={() => JSONViewerStore.exportSearch()}
					title='Export Search'
				/>
			</div>
			<input
				hidden
				ref={inputSearchRef}
				style={{ marginBottom: 10 }}
				type='file'
				accept='.json'
				onChange={ev => {
					if (ev.target.files) {
						readSearchFile(ev.target.files);
						if (inputSearchRef.current) inputSearchRef.current.value = '';
					}
				}}
			/>
		</div>
	);
};

export default observer(JSONSearch);

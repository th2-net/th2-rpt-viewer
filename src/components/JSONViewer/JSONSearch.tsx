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
				className='load-JSON-button'
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
					<option value={10}>millisec</option>
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
					className='import-JSON-button'
					onClick={() => inputSearchRef.current?.click()}
					title='Import Search'
				/>
				<div
					className='export-JSON-button'
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

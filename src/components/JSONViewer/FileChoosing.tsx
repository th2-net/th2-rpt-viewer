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

import * as React from 'react';
import { NotebookNode, NotebookParameters } from '../../models/JSONSchema';
import { ModalPortal } from '../util/Portal';
import { useOutsideClickListener } from '../../hooks';
import api from '../../api';
import { convertParameterToInput, parseText } from '../../helpers/JSONViewer';
import { TreeNode } from '../../stores/JSONViewer/TreeNode';

export const IGNORED_PARAMETERS_NAMES = ['output_path', 'output_images_path', 'customization_path'];

const FileChoosing = ({
	type,
	multiple,
	onSubmit,
	singleSubmit,
	close,
}: {
	type: 'notebooks' | 'results' | 'all';
	multiple: boolean;
	onSubmit?: (t: TreeNode[], n: NotebookNode[]) => void;
	singleSubmit?: (f: string) => void;
	close: () => void;
}) => {
	const [isLoading, setIsLoading] = React.useState(true);
	const [directories, setDirectories] = React.useState<string[]>([]);
	const [search, setSearch] = React.useState('');
	const [directory, setDirectory] = React.useState<string>('');
	const [files, setFiles] = React.useState<string[]>([]);
	const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
	const modalRef = React.useRef<HTMLDivElement>(null);

	const filteredFiles = React.useMemo(
		() => (files ? files.filter(file => file.includes(search)) : []),
		[files, search],
	);

	const filteredDirectories = React.useMemo(
		() => (directories ? directories.filter(dir => dir.includes(search)) : []),
		[directories, search],
	);

	const getLinks = async (dir?: string) => {
		setIsLoading(true);
		setDirectory(dir || '');
		api.jsonViewer
			.getLinks(type, dir)
			.then(data => {
				setFiles(data.files ? data.files : []);
				setDirectories(data.directories ? data.directories : []);
			})
			.finally(() => setIsLoading(false));
	};

	React.useEffect(() => {
		getLinks();
	}, []);

	const openDirectory = async (directoryName: string) => {
		getLinks(`${directoryName}`);
	};

	const closeModal = () => {
		close();
	};

	const closeDirectory = async () => {
		setDirectories([]);
		setFiles([]);
		if (directory === '') {
			closeModal();
		} else if (directory.indexOf('\\') === directory.lastIndexOf('\\')) {
			getLinks();
		} else {
			getLinks(`${directory.slice(0, directory.slice(0, -1).lastIndexOf('\\'))}`);
		}
	};

	const getFiles = () => {
		const fileData: TreeNode[] = [];
		const notebookData: NotebookNode[] = [];
		const promises: Promise<void>[] = [];
		if (selectedFiles.length > 0) {
			setIsLoading(true);
			if (type === 'notebooks') {
				selectedFiles.forEach(filePath =>
					promises.push(
						api.jsonViewer.getParameters(filePath).then((data: NotebookParameters) => {
							const parameters = Object.values(data).filter(
								param => !IGNORED_PARAMETERS_NAMES.includes(param.name),
							);
							const paramsValue = parameters.map(convertParameterToInput);
							const node: NotebookNode = {
								name: filePath,
								parameters,
								paramsValue,
								results: [],
								resultsCount: 1,
								open: true,
							};
							notebookData.push(node);
						}),
					),
				);
				Promise.all(promises).then(() => {
					if (onSubmit) onSubmit([], notebookData);
				});
			} else {
				selectedFiles.forEach(filePath =>
					promises.push(
						api.jsonViewer.getFile(filePath).then(({ result }) => {
							const node = TreeNode.createComplex(filePath);
							try {
								parseText(result, node, '0', true);
							} catch {
								const lines = result.split('\n');
								for (let i = 0; i < lines.length; i++) {
									if (lines[i] !== '') {
										parseText(lines[i], node, String(i), true);
									}
								}
							}
							fileData.push(node);
						}),
					),
				);
				Promise.all(promises).then(() => {
					if (onSubmit) onSubmit(fileData, notebookData);
				});
			}
		}
		closeModal();
	};

	const selectFile = (fileName: string) => {
		const fileIndex = selectedFiles.indexOf(fileName);
		if (!multiple && singleSubmit) {
			singleSubmit(fileName);
			return;
		}

		if (fileIndex > -1) {
			setSelectedFiles([
				...selectedFiles.slice(0, fileIndex),
				...selectedFiles.slice(fileIndex + 1),
			]);
		} else {
			setSelectedFiles([...selectedFiles, fileName]);
		}
	};

	useOutsideClickListener(modalRef, () => {
		closeModal();
	});

	return (
		<ModalPortal
			isOpen={true}
			ref={modalRef}
			style={{
				top: '5vh',
				left: '50%',
				width: '90%',
				transform: 'translateX(-50%)',
				position: 'absolute',
				zIndex: 110,
			}}>
			<div className='fileChoosing'>
				<div className='JSON-buttons-wrapper'>
					<input
						disabled={isLoading}
						className='JSON-input'
						type='text'
						value={search}
						onChange={e => setSearch(e.target.value)}
					/>
					{multiple && (
						<>
							<button
								disabled={selectedFiles.length === 0 || isLoading}
								className='JSON-load-button'
								onClick={() => setSelectedFiles([])}>
								Reset Selection
							</button>
							<button
								disabled={selectedFiles.length === 0 || isLoading}
								className='JSON-load-button'
								onClick={getFiles}>
								Load {selectedFiles.length} Files
							</button>
						</>
					)}
				</div>
				{isLoading ? (
					<div style={{ marginLeft: 5 }} className='fileChoosing__loading' />
				) : (
					<>
						<div className='fileChoosing__line' onClick={closeDirectory}>
							{directory === '' ? (
								<>
									<div className='fileChoosing__close-icon' />
									Close
								</>
							) : (
								<>
									<div className='fileChoosing__back-icon' />
									Back
								</>
							)}
						</div>
						{
							<>
								{filteredDirectories.map((dir, index) => (
									<div
										className='fileChoosing__line'
										key={index}
										onClick={() => openDirectory(dir)}>
										<div className='fileChoosing__directory-icon' />
										{decodeURI(dir).replace(directory, '')}
									</div>
								))}
							</>
						}
						{
							<>
								{filteredFiles.map((file, index) => (
									<div
										className={`fileChoosing__line ${
											selectedFiles.includes(file) ? 'selected' : ''
										}`}
										key={index}
										title={decodeURI(file)}
										onClick={() => selectFile(file)}>
										<div className='fileChoosing__file-icon' />
										{decodeURI(file).replace(directory, '')}
									</div>
								))}
							</>
						}
					</>
				)}
			</div>
		</ModalPortal>
	);
};

export default FileChoosing;

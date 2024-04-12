import * as React from 'react';
import { Tree } from '../../models/JSONSchema';
import { ModalPortal } from '../util/Portal';
import { useOutsideClickListener } from '../../hooks';
import api from '../../api';

const FileChoosing = ({
	onSubmit,
	close,
}: {
	onSubmit: (t: Tree[], n: string[]) => void;
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
		() => files.filter(file => file.includes(search)),
		[files, search],
	);

	const filteredDirectories = React.useMemo(
		() => directories.filter(dir => dir.includes(search)),
		[directories, search],
	);

	const getLinks = async (dir?: string) => {
		setIsLoading(true);
		setDirectory(dir || '');
		api.jsonViewer
			.getLinks(dir)
			.then(data => {
				setFiles(data.files);
				setDirectories(data.directories);
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
		const fileData: Tree[] = [];
		const notebookData: string[] = [];
		const promises: Promise<Tree | void>[] = [];
		if (selectedFiles.length > 0) {
			setIsLoading(true);
			selectedFiles.forEach(file =>
				promises.push(
					api.jsonViewer.getFile(file).then((data: Tree) => {
						if (file.endsWith('.ipynb')) {
							notebookData.push(file);
							return;
						}
						fileData.push(data);
					}),
				),
			);
			Promise.all(promises).then(() => {
				onSubmit(fileData, notebookData);
			});
		}
		// closeModal();
	};

	const selectFile = (fileName: string) => {
		const fileIndex = selectedFiles.indexOf(fileName);

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
					<button
						disabled={selectedFiles.length === 0 || isLoading}
						className='load-JSON-button'
						onClick={() => setSelectedFiles([])}>
						Reset Selection
					</button>
					<button
						disabled={selectedFiles.length === 0 || isLoading}
						className='load-JSON-button'
						onClick={getFiles}>
						Load {selectedFiles.length} Files
					</button>
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
						{directories.length > 0 && (
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
						)}
						{files.length > 0 && (
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
						)}
					</>
				)}
			</div>
		</ModalPortal>
	);
};

export default FileChoosing;

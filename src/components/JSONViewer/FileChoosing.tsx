import * as React from 'react';
import { Tree } from '../../models/JSONSchema';
import { ModalPortal } from '../util/Portal';
import { useOutsideClickListener } from '../../hooks';
import api from '../../api';

const directoriesURL = '/resources/viewer_data';

const FileChoosing = ({ onSubmit, close }: { onSubmit: (t: Tree) => void; close: () => void }) => {
	const [isLoading, setIsLoading] = React.useState(true);
	const [directories, setDirectories] = React.useState<string[]>([]);
	const [directory, setDirectory] = React.useState<string>('');
	const [files, setFiles] = React.useState<string[]>([]);
	const modalRef = React.useRef<HTMLDivElement>(null);

	const getDirectories = async () => {
		api.jsonViewer
			.getDirectories(directoriesURL)
			.then((data: string[]) => setDirectories(data))
			.finally(() => setIsLoading(false));
	};

	React.useEffect(() => {
		getDirectories();
	}, []);

	const getFiles = async (dir: string) => {
		api.jsonViewer
			.getFiles(directoriesURL, dir)
			.then((data: string[]) => setFiles(data))
			.finally(() => setIsLoading(false));
	};

	const getFile = async (fileName: string) => {
		api.jsonViewer
			.getFile(directoriesURL, directory, fileName)
			.then((data: Tree) => onSubmit(data))
			.finally(() => setIsLoading(false));
	};

	useOutsideClickListener(modalRef, () => {
		setDirectories([]);
		setDirectory('');
		setFiles([]);
		close();
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
				{isLoading ? (
					<div style={{ marginLeft: 5 }} className='fileChoosing__loading' />
				) : files.length > 0 ? (
					<>
						<div className='fileChoosing__line' onClick={() => setFiles([])}>
							<div className='fileChoosing__back-icon' />
							Back
						</div>
						{files.map((file, index) => (
							<div className='fileChoosing__line' key={index} onClick={() => getFile(file)}>
								<div className='fileChoosing__file-icon' />
								{file}
							</div>
						))}
					</>
				) : directories.length > 0 ? (
					<>
						<div className='fileChoosing__line' onClick={close}>
							<div className='fileChoosing__close-icon' />
							Close
						</div>
						{directories.map((dir, index) => (
							<div className='fileChoosing__line' key={index} onClick={() => getFiles(dir)}>
								<div className='fileChoosing__directory-icon' />
								{dir}
							</div>
						))}
					</>
				) : (
					<></>
				)}
			</div>
		</ModalPortal>
	);
};

export default FileChoosing;

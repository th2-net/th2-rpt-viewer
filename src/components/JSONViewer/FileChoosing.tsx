import * as React from 'react';
import { Tree } from '../../models/JSONSchema';
import { ModalPortal } from '../util/Portal';
import { useOutsideClickListener } from '../../hooks';
import notificationsStore from '../../stores/NotificationsStore';

const directoriesURL = '/resources/viewer_data';

const FileChoosing = ({ onSubmit, close }: { onSubmit: (t: Tree) => void; close: () => void }) => {
	const [isLoading, setIsLoading] = React.useState(true);
	const [directories, setDirectories] = React.useState<string[]>([]);
	const [directory, setDirectory] = React.useState<string>('');
	const [files, setFiles] = React.useState<string[]>([]);
	const modalRef = React.useRef<HTMLDivElement>(null);

	const fetchDirectories = async () => {
		const res = await fetch(directoriesURL, {
			headers: {
				Accept: 'application/json, text/plain, */*',
			},
		});

		if (res.ok) {
			res.json().then(data => setDirectories(data));
			setIsLoading(false);
			return;
		}
		notificationsStore.handleRequestError(res);
		setIsLoading(false);

		console.error(res.statusText);
	};

	React.useEffect(() => {
		fetchDirectories();
	}, []);

	const loadFiles = async (dir: string) => {
		setDirectory(dir);
		setIsLoading(true);
		const res = await fetch(`${directoriesURL}/${dir}`, {
			headers: {
				Accept: 'application/json, text/plain, */*',
			},
		});

		if (res.ok) {
			res.json().then(data => setFiles(data));
			setIsLoading(false);
			return;
		}
		notificationsStore.handleRequestError(res);
		setIsLoading(false);

		console.error(res.statusText);
	};

	const loadFile = async (fileName: string) => {
		setIsLoading(true);

		const res = await fetch(`${directoriesURL}/${directory}/${fileName}`, {
			headers: {
				Accept: 'application/json, text/plain, */*',
			},
		});

		if (res.ok) {
			res.json().then(data => onSubmit(data));
			setIsLoading(false);
			return;
		}
		setIsLoading(false);
		notificationsStore.handleRequestError(res);

		console.error(res.statusText);
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
							<div className='fileChoosing__line' key={index} onClick={() => loadFile(file)}>
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
							<div className='fileChoosing__line' key={index} onClick={() => loadFiles(dir)}>
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

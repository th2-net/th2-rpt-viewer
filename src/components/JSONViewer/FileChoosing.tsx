import * as React from 'react';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { Tree } from '../../models/JSONSchema';
import { ModalPortal } from '../util/Portal';
import { useOutsideClickListener } from '../../hooks';
import notificationsStore from '../../stores/NotificationsStore';

const FileChoosing = ({ onSubmit, close }: { onSubmit: (t: Tree) => void; close: () => void }) => {
	const [isLoading, setIsLoading] = React.useState(true);
	const [directories, setDirectories] = React.useState<string[]>([]);
	const [directory, setDirectory] = React.useState<string>('');
	const [files, setFiles] = React.useState<string[]>([]);
	const modalRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		axios
			.get('/resources/report_scripts_output')
			.then(v => setDirectories(v.data))
			.catch(reason => {
				notificationsStore.addMessage({
					header: `Failed to load directories from /resources/report_scripts_output`,
					description: reason.message,
					notificationType: 'genericError',
					id: nanoid(),
					type: 'error',
				});
				close();
			})
			.finally(() => setIsLoading(false));
	}, []);

	const loadFiles = (dir: string) => {
		setDirectory(dir);
		setIsLoading(true);
		axios
			.get(`/resources/report_scripts_output/${dir}`)
			.then(v => setFiles(v.data))
			.catch(reason => {
				notificationsStore.addMessage({
					header: `Failed to load files from /resources/report_scripts_output/${dir}`,
					description: reason.message,
					notificationType: 'genericError',
					id: nanoid(),
					type: 'error',
				});
				close();
			})
			.finally(() => setIsLoading(false));
	};

	const loadFile = (fileName: string) => {
		setIsLoading(true);
		axios
			.get(`/resources/report_scripts_output/${directory}/${fileName}`)
			.then(v => onSubmit(v.data))
			.catch(reason => {
				notificationsStore.addMessage({
					header: `Failed to load file from /resources/report_scripts_output/${directory}/${fileName}`,
					description: reason.message,
					notificationType: 'genericError',
					id: nanoid(),
					type: 'error',
				});
				close();
			})
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

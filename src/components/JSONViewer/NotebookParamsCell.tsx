import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import { NotebookParameter, NotebookParameters, TreeNode } from '../../models/JSONSchema';
import api from '../../api';
import '../../styles/jupyter.scss';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import { parseText } from '../../helpers/JSONViewer';
import { useNotificationsStore } from '../../hooks';

const timeBetweenResults = 1000;
const numberReg = /^-?\d*\.?\d{1,}$/;

const NotebookParamsCell = ({ notebook }: { notebook: string }) => {
	const JSONViewerStore = useJSONViewerStore();
	const notificationsStore = useNotificationsStore();
	const [parameters, setParameters] = React.useState<NotebookParameter[]>([]);
	const [paramsValue, setParamsValue] = React.useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = React.useState(true);
	const [isRunLoading, setIsRunLoading] = React.useState(false);
	const [isExpanded, setIsExpanded] = React.useState(false);
	const [timer, setTimer] = React.useState<NodeJS.Timeout | null>();
	const [taskId, setTaskId] = React.useState<string | null>();
	const keys: string[] = React.useMemo(() => parameters.map(param => param.name), [parameters]);

	const getParameters = async () => {
		setIsLoading(true);
		api.jsonViewer
			.getParameters(notebook)
			.then((data: NotebookParameters) => {
				setParameters(Object.values(data).filter(param => param.name !== 'output_path'));
			})
			.finally(() => {
				setIsLoading(false);
				setIsExpanded(true);
			});
	};

	const open = () => {
		if (isLoading) return;
		setIsExpanded(!isExpanded);
	};

	const getResults = async (respTaskId: string, path: string) => {
		const { status, result } = await api.jsonViewer.getResults(respTaskId);

		switch (status) {
			case 'success':
				if (result.includes('{')) {
					const node: TreeNode = {
						id: nanoid(),
						key: `Result of ${notebook}'s run`,
						failed: false,
						viewInstruction: '',
						simpleFields: [{ key: 'filepath', value: path }],
						complexFields: [],
						isGeneratedKey: true,
						isRoot: true,
					};
					try {
						node.complexFields.push(...parseText(result, '0', true));
					} catch {
						const lines = result.split('\n');
						for (let i = 0; i < lines.length; i++) {
							if (lines[i] !== '') {
								node.complexFields.push(...parseText(lines[i], String(i), true));
							}
						}
					}
					node.failed = node.complexFields.some(v => v.failed);
					if (node.complexFields.length > 0) {
						JSONViewerStore.addNodes([node]);
						JSONViewerStore.selectTreeNode(node);
					}
					setParamsValue({});
					setIsRunLoading(false);
					setIsExpanded(false);
				}
				break;
			case 'failed':
				{
					const response = new Response(result, {
						status: 500,
						statusText: `Failed to launch ${notebook}`,
					});
					notificationsStore.handleRequestError(response);
					setIsRunLoading(false);
				}
				break;
			case 'in progress':
				setTimer(setTimeout(() => getResults(respTaskId, path), timeBetweenResults));
				break;
			default:
				break;
		}
	};

	const runNotebook = async () => {
		if (isRunLoading) {
			if (timer) {
				clearTimeout(timer);
				setTimer(null);
			}
			if (taskId) {
				const stopAttempt = await api.jsonViewer.stopNotebook(taskId);
				setTaskId(null);
				setIsRunLoading(stopAttempt);
			} else {
				setIsRunLoading(false);
			}
			return;
		}
		setIsRunLoading(true);
		const paramsWithType = Object.fromEntries(
			Object.entries(paramsValue)
				.filter(val => val[1] !== '')
				.map(([name, value]) => {
					const ind = keys.indexOf(name);
					switch (parameters[ind].inferred_type_name) {
						case 'string':
							return [name, value];
						case 'float':
							return [name, parseFloat(value)];
						case 'int':
							return [name, parseInt(value)];
						default:
							if (numberReg.test(value)) {
								if (Number.isInteger(value)) {
									return [name, Number.parseInt(value)];
								}
								return [name, Number.parseFloat(value)];
							}
							return [name, value];
					}
				}),
		);
		const res = await api.jsonViewer.launchNotebook(notebook, paramsWithType);
		if (res.task_id !== '') {
			setTaskId(res.task_id);
			setTimer(setTimeout(() => getResults(res.task_id, res.path), timeBetweenResults));
		} else {
			setIsRunLoading(false);
		}
	};

	const refreshNotebook = () => {
		getParameters();
		setIsRunLoading(false);
	};

	React.useEffect(() => {
		getParameters();
	}, []);

	return (
		<div className='notebookCell'>
			<div className={`notebookCell-header ${isExpanded ? 'expanded' : ''}`} onClick={open}>
				<label>Parameters for {notebook}</label>
				<div
					className={`notebookCell-icon ${
						isLoading ? 'loading' : isExpanded ? 'expanded' : 'hidden'
					}`}
				/>
			</div>
			{isExpanded && !isLoading && (
				<div className='notebookCell-body'>
					<div className='notebookCell-body-table'>
						<table>
							<thead>
								{parameters.length > 0 && (
									<tr style={{ textAlign: 'left' }}>
										<th>Name</th>
										<th>Type</th>
										<th>Value</th>
									</tr>
								)}
							</thead>
							<tbody>
								{parameters.map(parameter => (
									<tr key={parameter.name}>
										<td>
											<label>{parameter.name}</label>
										</td>
										<td>
											<label>{parameter.inferred_type_name}</label>
										</td>
										<td>
											<input
												type='text'
												placeholder={`default: ${parameter.default}`}
												value={paramsValue[parameter.name]}
												onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
													const newState = paramsValue;
													newState[parameter.name] = ev.target.value;
													setParamsValue(newState);
												}}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className='buttons'>
						<button onClick={runNotebook}>
							<label>Run</label>
							<div className={`notebookCell-icon ${isRunLoading ? 'loading' : 'play'}`} />
						</button>
						<button onClick={refreshNotebook} disabled={isLoading}>
							<label>Refresh</label>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default observer(NotebookParamsCell);

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import {
	InputNotebookParameter,
	NotebookParameter,
	NotebookParameters,
	TreeNode,
} from '../../models/JSONSchema';
import api from '../../api';
import '../../styles/jupyter.scss';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import {
	convertParameterToInput,
	convertParameterValue,
	getParameterType,
	parseText,
	validateParameter,
} from '../../helpers/JSONViewer';
import { useNotificationsStore } from '../../hooks';
import ParametersRow from './ParametersRow';

const timeBetweenResults = 1000;

const NotebookParamsCell = ({ notebook }: { notebook: string }) => {
	const JSONViewerStore = useJSONViewerStore();
	const notificationsStore = useNotificationsStore();
	const [parameters, setParameters] = React.useState<NotebookParameter[]>([]);
	const [paramsValue, setParamsValue] = React.useState<InputNotebookParameter[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [isRunLoading, setIsRunLoading] = React.useState(false);
	const [isExpanded, setIsExpanded] = React.useState(false);
	const [timer, setTimer] = React.useState<NodeJS.Timeout | null>();
	const [taskId, setTaskId] = React.useState<string | null>();
	const [resultCount, setResultCount] = React.useState<string>('1');
	const [results, setResults] = React.useState<string[]>([]);
	const isValid = React.useMemo(() => paramsValue.every(v => v.isValid), [paramsValue]);

	const initParameters = () => {
		setParamsValue(parameters.map(convertParameterToInput));
	};

	React.useEffect(initParameters, [parameters]);

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
					const newResults = [node.id, ...results];
					const maxResultCount = Number(resultCount);
					const convertResultCount = maxResultCount < 1 ? 1 : Math.round(maxResultCount);
					if (maxResultCount < 1) {
						setResultCount('1');
					}

					if (node.complexFields.length > 0) {
						JSONViewerStore.addNodes([node]);
						if (newResults.length > convertResultCount) {
							JSONViewerStore.removeNodesById(newResults.slice(convertResultCount));
						}
						setResults(newResults.slice(0, convertResultCount));
						JSONViewerStore.selectTreeNode(node);
					}
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

	const filterParameters = (inputParameter: InputNotebookParameter, index: number) => {
		const parameter = parameters[index];
		const parameterType = getParameterType(parameter.default, parameter.inferred_type_name);
		const newValue = convertParameterValue(inputParameter.value, inputParameter.type);
		const oldValue = convertParameterValue(parameter.default, parameterType, true);
		if (typeof newValue !== typeof oldValue) return true;
		return newValue !== oldValue;
	};

	const runNotebook = async () => {
		if (isRunLoading) {
			if (timer) {
				clearTimeout(timer);
				setTimer(null);
			}
			if (taskId) {
				await api.jsonViewer.stopNotebook(taskId);
				setTaskId(null);
			} else {
				setIsRunLoading(false);
			}
			setIsRunLoading(false);
			return;
		}
		setIsRunLoading(true);
		const paramsWithType = Object.fromEntries(
			paramsValue
				.filter(filterParameters)
				.map(({ name, type, value }) => [name, convertParameterValue(value, type)]),
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
								{parameters.map((parameter, index) => (
									<ParametersRow
										parameter={parameter}
										parameterValue={paramsValue[index]}
										setParametersValue={(newValue: string) => {
											const newState = paramsValue[index];
											newState.value = newValue;
											newState.isValid = validateParameter(newState.value, newState.type);
											setParamsValue([
												...paramsValue.slice(0, index),
												newState,
												...paramsValue.slice(index + 1),
											]);
										}}
										setParametersType={(newValue: string) => {
											const newState = paramsValue[index];
											newState.type = newValue;
											newState.isValid = validateParameter(newState.value, newState.type);
											setParamsValue([
												...paramsValue.slice(0, index),
												newState,
												...paramsValue.slice(index + 1),
											]);
										}}
										key={parameter.name}
									/>
								))}
							</tbody>
						</table>
					</div>
					<div className='buttons'>
						<button onClick={runNotebook} disabled={!isValid}>
							<label>Run</label>
							<div className={`notebookCell-icon ${isRunLoading ? 'loading' : 'play'}`} />
						</button>
						<button onClick={refreshNotebook} disabled={isLoading}>
							<label>Refresh</label>
						</button>
						<div style={{ display: 'flex', gap: '2px' }}>
							<div>Save</div>
							<input
								style={{ width: '100%' }}
								type='number'
								value={resultCount}
								pattern='\d+'
								onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
									setResultCount(ev.target.value);
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default observer(NotebookParamsCell);

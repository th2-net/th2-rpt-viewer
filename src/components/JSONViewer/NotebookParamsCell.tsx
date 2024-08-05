import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import {
	InputNotebookParameter,
	NotebookNode,
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

const timeBetweenResults = 50;

const NotebookParamsCell = ({ notebookProp }: { notebookProp: NotebookNode }) => {
	const JSONViewerStore = useJSONViewerStore();
	const notificationsStore = useNotificationsStore();
	const notebook: NotebookNode = {
		...JSONViewerStore.getNotebook(notebookProp.name, notebookProp),
	};
	const [parameters, setParameters] = React.useState<NotebookParameter[]>(notebook.parameters);
	const [paramsValue, setParamsValue] = React.useState<InputNotebookParameter[]>(
		notebook.paramsValue,
	);
	const [isLoading, setIsLoading] = React.useState(false);
	const [isRunLoading, setIsRunLoading] = React.useState(false);
	const [isExpanded, setIsExpanded] = React.useState(notebook.open);
	const [timer, setTimer] = React.useState<NodeJS.Timeout | null>();
	const [taskId, setTaskId] = React.useState<string | null>();
	const [resultCount, setResultCount] = React.useState<string>(String(notebook.resultsCount));
	const [results, setResults] = React.useState<string[]>(notebook.results);
	const isValid = React.useMemo(() => paramsValue.every(v => v.isValid), [paramsValue]);

	const getParameters = async () => {
		setIsLoading(true);
		api.jsonViewer
			.getParameters(notebook.name)
			.then((data: NotebookParameters) => {
				const newParameters = Object.values(data).filter(param => param.name !== 'output_path');
				const newParamsValue = newParameters.map(convertParameterToInput);
				setParameters(newParameters);
				setParamsValue(newParamsValue);
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

	const getResults = async (respTaskId: string) => {
		const { status, result, path } = await api.jsonViewer.getResults(respTaskId);

		switch (status) {
			case 'success':
				if (result.includes('{')) {
					const node: TreeNode = {
						id: nanoid(),
						parentIds: [],
						key: `Result of ${notebook.name}'s run`,
						failed: false,
						viewInstruction: '',
						simpleFields: [{ id: nanoid(), key: 'filepath', value: path }],
						complexFields: [],
						childIds: [],
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
					const convertResultCount = Math.max(1, Math.round(maxResultCount));
					JSONViewerStore.addNotebookResult(notebook.name, node, convertResultCount);
					setResultCount(String(convertResultCount));
					setResults(newResults.slice(0, convertResultCount));
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
				setTimer(setTimeout(() => getResults(respTaskId), timeBetweenResults));
				break;
			default:
				break;
		}
	};

	const filterParameters = (inputParameter: InputNotebookParameter, index: number) => {
		const parameter = parameters[index];
		const parameterType = getParameterType(parameter);
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
		const res = await api.jsonViewer.launchNotebook(notebook.name, paramsWithType);
		if (res.task_id !== '') {
			setTaskId(res.task_id);
			setTimer(setTimeout(() => getResults(res.task_id), timeBetweenResults));
		} else {
			setIsRunLoading(false);
		}
	};

	const refreshNotebook = () => {
		getParameters();
		setIsRunLoading(false);
	};

	return (
		<div className='notebookCell'>
			<div className={`notebookCell-header ${isExpanded ? 'expanded' : ''}`} onClick={open}>
				<label>Parameters for {notebook.name}</label>
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
					</div>
				</div>
			)}
			{isExpanded && (
				<div className='notebookCell-settings'>
					<div style={{ display: 'flex', gap: '5px' }}>
						<div>Results Amount:</div>
						<input
							style={{ maxWidth: 400 }}
							type='number'
							value={resultCount}
							pattern='\d+'
							onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
								setResultCount(ev.target.value);
								JSONViewerStore.updateotebookResultCount(notebookProp.name, ev.target.value);
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default observer(NotebookParamsCell);

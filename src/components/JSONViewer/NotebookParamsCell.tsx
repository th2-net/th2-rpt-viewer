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
	OFF_VALUE,
	parseText,
	validateParameter,
} from '../../helpers/JSONViewer';
import { useNotificationsStore, useOutsideClickListener } from '../../hooks';
import ParametersRow from './ParametersRow';
import { downloadTxtFile } from '../../helpers/files/downloadTxt';
import { ToolsPopup } from './LeafTools';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';

const timeBetweenResults = 50;
const ignoredParamNames = ['output_path', 'customization_path'];

const NotebookParamsCell = ({
	notebookProp,
	type,
}: {
	notebookProp: NotebookNode;
	type: PanelType;
}) => {
	const JSONViewerStore = useJSONViewerStore();
	const notificationsStore = useNotificationsStore();
	const notebook: NotebookNode = {
		...JSONViewerStore.getNotebook(notebookProp.name, notebookProp, type),
	};
	const [parameters, setParameters] = React.useState<NotebookParameter[]>(notebook.parameters);
	const [paramsValue, setParamsValue] = React.useState<InputNotebookParameter[]>(
		notebook.paramsValue,
	);
	const [isLoading, setIsLoading] = React.useState(false);
	const [isRunLoading, setIsRunLoading] = React.useState(false);
	const [isReloadOpen, setIsReloadOpen] = React.useState(false);
	const [isExpanded, setIsExpanded] = React.useState(notebook.open);
	const [timer, setTimer] = React.useState<NodeJS.Timeout | null>();
	const [taskId, setTaskId] = React.useState<string | null>();
	const [resultCount, setResultCount] = React.useState<string>(String(notebook.resultsCount));
	const [results, setResults] = React.useState<string[]>(notebook.results);
	const isValid = React.useMemo(() => paramsValue.every(v => v.isValid || v.isOff), [paramsValue]);
	const reloadRef = React.useRef<HTMLButtonElement>(null);
	const inputJSONRef = React.useRef<HTMLInputElement>(null);

	const getParameters = async () => {
		setIsLoading(true);
		api.jsonViewer
			.getParameters(notebook.name)
			.then((data: NotebookParameters) => {
				const newParameters = Object.values(data).filter(
					param => !ignoredParamNames.includes(param.name),
				);
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
		JSONViewerStore.setNotebook(
			{
				...notebook,
				open: !isExpanded,
			},
			type,
		);
	};

	const savePreset = () => {
		downloadTxtFile(
			[
				JSON.stringify(
					paramsValue.map(val => ({
						name: val.name,
						value: val.value,
						type: val.type,
						isOff: val.isOff,
					})),
				),
			],
			`preset for ${notebook.name.slice(notebook.name.lastIndexOf('/'))}.json`,
		);
	};

	const getResults = async (respTaskId: string) => {
		const { status, result, path, customization } = await api.jsonViewer.getResults(respTaskId);

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
						height: 22,
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
					JSONViewerStore.addNotebookResult(notebook.name, node, convertResultCount, type);
					setResultCount(String(convertResultCount));
					setResults(newResults.slice(0, convertResultCount));
					if (customization) JSONViewerStore.updateTokensFromText(customization, type);
					setIsExpanded(false);
				} else {
					notificationsStore.addMessage({
						id: nanoid(),
						notificationType: 'genericError',
						header: `Failed to get result`,
						type: 'error',
						description: `Resulting file of ${notebook.name} doesn't include json.`,
					});
					setIsRunLoading(false);
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
			case 'error':
				setIsRunLoading(false);
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
				.map(({ name, type: paramType, value, isOff }) => [
					name,
					isOff ? { value: OFF_VALUE, type: 'str' } : convertParameterValue(value, paramType),
				]),
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

	const readFile = async (files: FileList) => {
		const presetText = await files[0].text();
		const prevValue = JSON.parse(JSON.stringify(paramsValue));
		let params = JSON.parse(JSON.stringify(paramsValue));
		try {
			const preset: Array<{ name: string; value: string; type: string; isOff: string }> =
				JSON.parse(presetText);
			const presetKeys = preset.map(p => p.name);
			const parametersKeys = parameters.map(p => p.name);
			const indexes = presetKeys.map(p => parametersKeys.indexOf(p));
			const notIncludedParameters = parametersKeys.filter(p => !presetKeys.includes(p));
			const errors = [];
			for (let i = 0; i < notIncludedParameters.length; i++) {
				errors.push(`Parameter ${notIncludedParameters[i]} not included in preset and was skipped`);
			}
			for (let i = 0; i < preset.length; i++) {
				if (indexes[i] < 0) {
					errors.push(`Parameter ${preset[i].name} not included in notebook and was skipped`);
				} else {
					params = [
						...params.slice(0, indexes[i]),
						{
							...preset[i],
							isValid: validateParameter(preset[i].value, preset[i].type),
						},
						...params.slice(indexes[i] + 1),
					];
				}
			}
			if (errors.length > 0) {
				notificationsStore.addMessage({
					id: nanoid(),
					notificationType: 'genericError',
					header: `Errors in parsing preset file for ${notebook.name}`,
					type: 'error',
					action: {
						label: 'Revert Changes',
						callback: () => {
							setParamsValue(prevValue);
						},
					},
					description: errors.join('\n'),
				});
			}
			setParamsValue(params.slice());
		} catch (error) {
			notificationsStore.addMessage({
				id: nanoid(),
				notificationType: 'genericError',
				header: `Unable to parse preset file for ${notebook.name}`,
				type: 'error',
				description: error instanceof Error ? error.message : `${error}`,
			});
		}
	};

	useOutsideClickListener(
		reloadRef,
		(e: MouseEvent) => {
			if (
				e.target instanceof Element &&
				reloadRef.current &&
				!reloadRef.current.contains(e.target)
			) {
				setIsReloadOpen(false);
			}
		},
		isReloadOpen,
	);

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
										<th>Off</th>
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
										toggleParameter={(newToggle: boolean) => {
											const newState = paramsValue[index];
											newState.isOff = newToggle;
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
						<button ref={reloadRef} disabled={isLoading} onClick={() => setIsReloadOpen(true)}>
							<label>Reload</label>
							<ToolsPopup isOpen={isReloadOpen}>
								<div className='message-card-tools__controls-group'>
									<div
										title='Reload from Server'
										className='message-card-tools__item'
										onClick={e => {
											e.stopPropagation();
											setIsReloadOpen(false);
											refreshNotebook();
										}}>
										<span className='message-card-tools__item-title'>From Server</span>
									</div>
									<div
										title='Reload from Preset'
										className='message-card-tools__item'
										onClick={e => {
											e.stopPropagation();
											setIsReloadOpen(false);
											inputJSONRef.current?.click();
										}}>
										<span className='message-card-tools__item-title'>From Preset</span>
									</div>
								</div>
							</ToolsPopup>
							<input
								hidden
								ref={inputJSONRef}
								style={{ marginBottom: 10 }}
								type='file'
								accept='.json'
								onChange={ev => {
									if (ev.target.files) {
										readFile(ev.target.files);
										if (inputJSONRef.current) inputJSONRef.current.value = '';
									}
								}}
							/>
						</button>
						<button onClick={savePreset} disabled={isLoading} title='Save Preseet'>
							<label>Save</label>
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
								JSONViewerStore.updateotebookResultCount(notebookProp.name, ev.target.value, type);
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default observer(NotebookParamsCell);

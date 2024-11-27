import * as React from 'react';
import AceEditor from 'react-ace';
import moment from 'moment';
// eslint-disable-next-line import/no-unassigned-import
import 'ace-builds/src-noconflict/mode-python';
// eslint-disable-next-line import/no-unassigned-import
import 'ace-builds/src-noconflict/ext-language_tools';
import { InputNotebookParameter, NotebookParameter } from '../../models/JSONSchema';
import FileChoosing from './FileChoosing';
import { DateTimeInputType, DateTimeMask, TimeInputType } from '../../models/filter/FilterInputs';
import { DATE_TIME_ISO_INPUT_MASK } from '../../util/filterInputs';
import TimestampParameter from './TimestampParameter';
import Checkbox from '../util/Checkbox';

const possibleTypes = ['int', 'float', 'str', 'bool', 'file path', 'timestamp', 'pycode'];

const ParametersRow = ({
	parameter,
	parameterValue,
	setParametersValue,
	setParametersType,
	toggleParameter,
}: {
	parameter: NotebookParameter;
	parameterValue: InputNotebookParameter;
	setParametersValue: (newValue: string) => void;
	setParametersType: (newValue: string) => void;
	toggleParameter: (toggle: boolean) => void;
}) => {
	const [browserOpen, setBrowserOpen] = React.useState(false);
	const [timestamp, setTimestampNumber] = React.useState<number | null>(moment.utc().valueOf());
	React.useEffect(() => {
		if (parameterValue.type !== 'timestamp') return;
		const momentFromDefault = moment.utc(parameterValue.value);

		if (momentFromDefault.isValid()) {
			setParametersValue(momentFromDefault.toISOString());
			setTimestampNumber(momentFromDefault.valueOf());
		} else {
			setParametersValue(moment.utc().toISOString());
			setTimestampNumber(moment.utc().valueOf());
		}
	}, [parameterValue.type]);

	const updateValue = (file: string) => {
		setParametersValue(file);
		setBrowserOpen(false);
	};

	const setTimestamp = (nextValue: number | null) => {
		setTimestampNumber(nextValue);
		setParametersValue(moment.utc(nextValue).toISOString());
	};

	const timestampConfig: DateTimeInputType = {
		id: 'startTimestamp',
		value: timestamp,
		setValue: setTimestamp,
		type: TimeInputType.DATE_TIME,
		dateMask: DateTimeMask.DATE_TIME_ISO_MASK,
		placeholder: '',
		inputMask: DATE_TIME_ISO_INPUT_MASK,
		disabled: parameterValue.isOff,
	};

	return (
		<tr>
			<td>
				<Checkbox
					checked={!parameterValue.isOff}
					onChange={e => {
						toggleParameter(!e.target.checked);
					}}
					label=''
					id={`{parameter.name}-toggle`}
				/>
			</td>
			<td>
				<label>{parameter.name}</label>
			</td>
			<td>
				<select
					disabled={parameter.inferred_type_name !== 'None' || parameterValue.isOff}
					value={parameterValue.type}
					onChange={(ev: React.ChangeEvent<HTMLSelectElement>) =>
						setParametersType(ev.target.value)
					}>
					{possibleTypes.map(type => (
						<option value={type} key={type}>
							{type}
						</option>
					))}
				</select>
			</td>
			<td>
				<div className='input-wrapper'>
					{parameterValue.type === 'timestamp' ? (
						<TimestampParameter inputConfig={timestampConfig} />
					) : (
						<>
							{parameterValue.type === 'file path' && (
								<button
									className='open-browser'
									onClick={() => setBrowserOpen(true)}
									title='Open  file browser'
									disabled={parameterValue.isOff}
								/>
							)}
							{parameterValue.type === 'pycode' && (
								<div
									style={{
										height: `${
											parameterValue.value !== ''
												? parameterValue.value.split('\n').length * 14 + 2
												: 16
										}px`,
										width: '100%',
										border: '1px solid black',
										borderRadius: '5px',
									}}>
									<AceEditor
										readOnly={parameterValue.isOff}
										mode='python'
										showGutter={false}
										height='100%'
										width='100%'
										value={parameterValue.value}
										onChange={(newValue: string) => {
											setParametersValue(newValue);
										}}
									/>
								</div>
							)}
							{parameterValue.type !== 'pycode' && (
								<input
									style={{ width: '100%' }}
									type='text'
									className={parameterValue.isValid ? undefined : 'failed'}
									placeholder={`default: ${parameter.default}`}
									value={parameterValue.value}
									onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
										const newValue = ev.target.value;
										setParametersValue(newValue);
									}}
									disabled={parameterValue.isOff}
								/>
							)}
						</>
					)}
				</div>

				{parameterValue.type === 'file path' && browserOpen && (
					<FileChoosing
						type='all'
						multiple={false}
						singleSubmit={updateValue}
						close={() => setBrowserOpen(false)}
					/>
				)}
			</td>
		</tr>
	);
};

export default ParametersRow;

import * as React from 'react';
import moment from 'moment';
import { InputNotebookParameter, NotebookParameter, TreeNode } from '../../models/JSONSchema';
import FileChoosing from './FileChoosing';
import { DateTimeInputType, DateTimeMask, TimeInputType } from '../../models/filter/FilterInputs';
import { DATE_TIME_INPUT_MASK } from '../../util/filterInputs';
import TimestampParameter from './TimestampParameter';

const possibleTypes = ['int', 'float', 'str', 'bool', 'file path', 'timestamp'];

const ParametersRow = ({
	parameter,
	parameterValue,
	setParametersValue,
	setParametersType,
}: {
	parameter: NotebookParameter;
	parameterValue: InputNotebookParameter;
	setParametersValue: (newValue: string) => void;
	setParametersType: (newValue: string) => void;
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

	const updateValue = (_t: TreeNode[], files: string[]) => {
		setParametersValue(files[0]);
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
		dateMask: DateTimeMask.DATE_TIME_MASK,
		placeholder: '',
		inputMask: DATE_TIME_INPUT_MASK,
	};

	return (
		<tr>
			<td>
				<label>{parameter.name}</label>
			</td>
			<td>
				<select
					disabled={parameter.inferred_type_name !== 'None'}
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
								/>
							)}
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
							/>
						</>
					)}
				</div>

				{parameterValue.type === 'file path' && browserOpen && (
					<FileChoosing
						type='all'
						multiple={false}
						onSubmit={updateValue}
						close={() => setBrowserOpen(false)}
					/>
				)}
			</td>
		</tr>
	);
};

export default ParametersRow;

import * as React from 'react';
import { InputNotebookParameter, NotebookParameter } from '../../models/JSONSchema';

const possibleTypes = ['int', 'float', 'string', 'boolean'];

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
}) => (
	<tr>
		<td>
			<label>{parameter.name}</label>
		</td>
		<td>
			<select
				disabled={parameter.inferred_type_name !== 'None'}
				value={parameterValue.type}
				onChange={(ev: React.ChangeEvent<HTMLSelectElement>) => setParametersType(ev.target.value)}>
				{possibleTypes.map(type => (
					<option value={type} key={type}>
						{type}
					</option>
				))}
			</select>
		</td>
		<td>
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
		</td>
	</tr>
);

export default ParametersRow;

import React from 'react';
import { SimpleField, TreeNode } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import { isKeyFailed, isValueFailed } from '../../helpers/JSONViewer';

const Table = ({
	simpleFields,
	complexFields,
}: {
	simpleFields: SimpleField[];
	complexFields: TreeNode[];
}) => (
	<div className='params-table'>
		<div className='params-table-wrapper'>
			<table style={{ gridTemplateColumns: '0.2fr 0.8fr' }}>
				<thead>
					<tr>
						<th style={{ gridColumn: '1 / 2' }}></th>
						<th style={{ gridColumn: `2 / 3` }} key='fieldValue'>
							fieldValue
						</th>
					</tr>
				</thead>
				<tbody>
					<TableRows simpleFields={simpleFields} complexFields={complexFields} />
				</tbody>
			</table>
		</div>
	</div>
);

const TableRows = ({
	simpleFields,
	complexFields,
}: {
	simpleFields: SimpleField[];
	complexFields: TreeNode[];
}) => (
	<>
		{simpleFields.map(({ key, value }) => (
			<tr
				key={`${key}:${value}`}
				className={createBemBlock(
					'params-table-row-value',
					typeof value === 'string'
						? value === ''
							? isKeyFailed(key)
								? 'failed'
								: 'passed'
							: isValueFailed(value)
							? 'failed'
							: 'passed'
						: typeof value === 'number'
						? isKeyFailed(key)
							? 'failed'
							: 'passed'
						: null,
				)}>
				{value === '' ? (
					<td style={{ gridColumn: `1/3` }}>
						<p>{key}</p>
					</td>
				) : (
					<>
						<td>
							<p>{key}</p>
						</td>
						<td>
							<p>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
						</td>
					</>
				)}
			</tr>
		))}
		{complexFields.map(field => (
			<ExpandRow field={field} key={field.key} />
		))}
	</>
);

const ExpandRow = ({ field }: { field: TreeNode }) => {
	const [isOpen, setIsOpen] = React.useState(false);
	return (
		<>
			<tr
				className={createBemBlock('params-table-row-toogler', field.failed ? 'failed' : 'passed')}
				onClick={() => setIsOpen(!isOpen)}>
				<td style={{ gridColumn: `1/3` }}>
					<div className='leafWrapper'>
						<div className={createBemBlock('expand-icon', isOpen ? 'expanded' : 'hidden')} />
						<div className={'valueLeaf-table'} title={field.key}>
							{field.key}
						</div>
					</div>
				</td>
			</tr>
			{isOpen && (
				<tr>
					<td style={{ gridColumn: `1/3` }}>
						<div className='params-table'>
							<div className='params-table-wrapper'>
								<table style={{ gridTemplateColumns: '0.2fr 0.8fr' }}>
									<tbody>
										<TableRows
											simpleFields={field.simpleFields}
											complexFields={field.complexFields}
										/>
									</tbody>
								</table>
							</div>
						</div>
					</td>
				</tr>
			)}
		</>
	);
};

export default Table;

import React from 'react';
import { SimpleField, TreeNode } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import DetailedMessageRaw from '../message/message-card/raw/DetailedMessageRaw';

const Table = ({
	simpleFields,
	complexFields,
}: {
	simpleFields: SimpleField[];
	complexFields: TreeNode[];
}) => (
	<div className='json-table'>
		<div className='json-table-wrapper'>
			<table style={{ gridTemplateColumns: '1fr 1fr' }}>
				<thead>
					<tr>
						<th style={{ gridColumn: '1 / 2' }} key='fieldKey'>
							fieldKey
						</th>
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
}) => {
	const getValue = ({ key, value }: SimpleField) => {
		if (key.endsWith('Base64')) return <DetailedMessageRaw rawContent={value} />;
		if (typeof value === 'object') return <p>{JSON.stringify(value)}</p>;
		return <p>{String(value)}</p>;
	};

	return (
		<>
			{simpleFields.map(({ key, value }, index) => (
				<tr key={`${key}:${value}:${index}`} className={createBemBlock('json-table-row-value')}>
					{value === '' ? (
						<td style={{ gridColumn: `1/3` }}>
							<p>{key}</p>
						</td>
					) : (
						<>
							<td>
								<p>{key}</p>
							</td>
							<td>{getValue({ key, value })}</td>
						</>
					)}
				</tr>
			))}
			{complexFields.map(field => (
				<ExpandRow field={field} key={`${field.id}`} />
			))}
		</>
	);
};

const ExpandRow = ({ field }: { field: TreeNode }) => {
	const [isOpen, setIsOpen] = React.useState(false);
	return (
		<>
			<tr className={createBemBlock('json-table-row-toogler')} onClick={() => setIsOpen(!isOpen)}>
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
						<div className='json-table'>
							<div className='json-table-wrapper'>
								<table style={{ gridTemplateColumns: '1fr 1fr' }}>
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

import React, { useMemo } from 'react';
import { SimpleField, TreeNode, TreeViewType } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import DetailedMessageRaw from '../message/message-card/raw/DetailedMessageRaw';
import { decodeBase64RawContent } from '../../helpers/rawFormatter';
import SimpleMessageRaw from '../message/message-card/raw/SimpleMessageRaw';
import LeafTools from './LeafTools';

const Table = ({
	simpleFields,
	complexFields,
}: {
	simpleFields: SimpleField[];
	complexFields: TreeNode[];
}) => (
	<div className='json-table'>
		<div className='json-table-wrapper'>
			<table>
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

const Base64Cell = ({ value }: { value: string }) => {
	const [viewType, setViewType] = React.useState(TreeViewType.ASCII);
	const viewTypes = [TreeViewType.ORIGIN, TreeViewType.BINARY, TreeViewType.ASCII];

	switch (viewType) {
		case TreeViewType.ASCII:
			return (
				<div className='json-table-Base64Cell'>
					<SimpleMessageRaw rawContent={value} />
					<LeafTools activeViewType={viewType} toggleViewType={setViewType} viewTypes={viewTypes} />
				</div>
			);
		case TreeViewType.BINARY:
			return (
				<div className='json-table-Base64Cell'>
					<DetailedMessageRaw rawContent={value} />
					<LeafTools activeViewType={viewType} toggleViewType={setViewType} viewTypes={viewTypes} />
				</div>
			);
		case TreeViewType.ORIGIN:
			return (
				<div className='json-table-Base64Cell'>
					<div>
						<p>{String(value)}</p>
					</div>
					<LeafTools activeViewType={viewType} toggleViewType={setViewType} viewTypes={viewTypes} />
				</div>
			);
		default:
			return <></>;
	}
};

const TableRows = ({
	simpleFields,
	complexFields,
}: {
	simpleFields: SimpleField[];
	complexFields: TreeNode[];
}) => {
	const getValue = ({ key, value }: SimpleField) => {
		if (key.endsWith('Base64')) {
			try {
				decodeBase64RawContent(value);
				return <Base64Cell value={value} />;
			} catch (_error) {
				return (
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<p style={{ color: 'red' }}>Failed to decode Base64:</p>
						<p>{String(value)}</p>
					</div>
				);
			}
		}
		if (typeof value === 'object') return <p>{JSON.stringify(value)}</p>;
		return <p>{typeof value === 'string' ? `"${value}"` : String(value)}</p>;
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
	const nodeName = useMemo(() => {
		if (field.displayName) return field.displayName;
		if (field.key && !(field.isGeneratedKey && !field.isRoot)) return field.key;
		return 'no display name';
	}, [field.displayName, field.key, field.isGeneratedKey]);

	return (
		<>
			<tr className={createBemBlock('json-table-row-toogler')} onClick={() => setIsOpen(!isOpen)}>
				<td style={{ gridColumn: `1/3` }}>
					<div className='leafWrapper'>
						<div className={createBemBlock('expand-icon', isOpen ? 'expanded' : 'hidden')} />
						<div className={'valueLeaf-table'} title={nodeName}>
							{nodeName}
						</div>
					</div>
				</td>
			</tr>
			{isOpen && (
				<tr>
					<td style={{ gridColumn: `1/3` }}>
						<div className='json-table'>
							<div className='json-table-wrapper'>
								<table>
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

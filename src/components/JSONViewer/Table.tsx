import React from 'react';
import { Tree } from '../../models/JSONSchema';
import { isSimpleLeaf } from '../../helpers/JSONViewer';
import { createBemBlock } from '../../helpers/styleCreators';

const Table = ({ rows }: { rows: [string, string | number | string[] | Tree | undefined][] }) => (
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
					<TableRows rows={rows} />
				</tbody>
			</table>
		</div>
	</div>
);

const TableRows = ({
	rows,
}: {
	rows: [string, string | number | string[] | Tree | undefined][];
}) => (
	<>
		{rows.map(([key, value]) =>
			value && (!isSimpleLeaf(value) || Array.isArray(value)) && typeof value !== 'string' ? (
				<React.Fragment key={`${key}:${value}`}>
					<ExpandRow parentKey={key} rows={Object.entries(value)} />
				</React.Fragment>
			) : (
				<tr
					key={`${key}:${value}`}
					className={createBemBlock(
						'params-table-row-value',
						typeof value === 'string'
							? value === ''
								? key.includes('[fail]') || key.trim().indexOf('#') === 0
									? 'failed'
									: 'passed'
								: value.trim().indexOf('#') === 0 || value.indexOf('!#') === 0
								? 'failed'
								: 'passed'
							: typeof value === 'number'
							? key.includes('[fail]') || key.trim().indexOf('#') === 0
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
								<p>{String(value)}</p>
							</td>
						</>
					)}
				</tr>
			),
		)}
	</>
);

const ExpandRow = ({
	parentKey,
	rows,
}: {
	parentKey: string;
	rows: [string, string | number | string[] | Tree | undefined][];
}) => {
	const [isOpen, setIsOpen] = React.useState(false);
	return (
		<>
			<tr
				className={createBemBlock(
					'params-table-row-toogler',
					parentKey.trim().indexOf('#') === 0 || parentKey.indexOf('!#') === 0
						? 'failed'
						: 'passed',
				)}
				onClick={() => setIsOpen(!isOpen)}>
				<td style={{ gridColumn: `1/3` }}>
					<div className='leafWrapper'>
						<div className={createBemBlock('expand-icon', isOpen ? 'expanded' : 'hidden')} />
						<div className={'valueLeaf-table'} title={parentKey}>
							{parentKey}
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
										<TableRows rows={rows.filter(Boolean)} />
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

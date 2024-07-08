import React from 'react';

const shownCapacity = 50;

const DisplayTable = ({ value }: { value: string[][] | undefined }) => {
	const [shownSize, setShownSize] = React.useState(shownCapacity);
	if (!value) return <div className='display-table-error'>#display-table is undefined</div>;

	const header = value[0];
	const rows = value.slice(1);

	return (
		<div className='display-table'>
			<table style={{ gridTemplateColumns: `repeat(${header.length}, 1fr) 16px` }}>
				<thead>
					<tr>
						{header.map((key, index) => (
							<th key={index}>{key}</th>
						))}
						<th style={{ width: '16px' }}></th>
					</tr>
				</thead>
				<tbody>
					{rows.slice(0, shownSize).map((row, index) => (
						<tr key={index}>
							{row.slice(0, header.length).map((val, ind) => (
								<td key={ind}>{typeof val === 'string' ? `"${val}"` : String(val)}</td>
							))}
							{row.length < header.length &&
								Array(header.length - row.length)
									.fill('')
									.map((_val, ind) => <td key={ind}></td>)}
							<td style={{ width: '16px' }}>
								{header.length < row.length && (
									<div
										className='display-table-info'
										title={`Not included extra cells: ${JSON.stringify(row.slice(header.length))}`}
									/>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{shownSize < rows.length && (
				<button
					onClick={() => setShownSize(shownSize + shownCapacity)}
					className='actions-list__load-button'>
					Show More
				</button>
			)}
		</div>
	);
};

export default DisplayTable;

import React from 'react';

const DisplayTable = ({ value }: { value: string[][] }) => {
	const header = value[0];
	const rows = value.slice(1);
	const [shownSize, setShownSize] = React.useState(5);

	return (
		<div className='display-table'>
			<table style={{ gridTemplateColumns: `repeat(${header.length}, 1fr)` }}>
				<thead>
					<tr>
						{header.map((key, index) => (
							<th key={index}>{key}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.slice(0, shownSize).map((row, index) => (
						<tr key={index}>
							{row.map((val, ind) => (
								<td key={ind} className={header.length <= ind ? 'incorrect' : undefined}>
									{val}
								</td>
							))}
							{row.length % header.length !== 0 &&
								Array(header.length - (row.length % header.length))
									.fill(false)
									.map((_v, ind) => <td key={ind} className={'incorrect'}></td>)}
						</tr>
					))}
				</tbody>
			</table>
			{shownSize < rows.length && (
				<button onClick={() => setShownSize(shownSize + 5)} className='actions-list__load-button'>
					Show More
				</button>
			)}
		</div>
	);
};

export default DisplayTable;

import { observer } from 'mobx-react-lite';
import React from 'react';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';

const shownCapacity = 1000;

const DisplayTable = ({
	value,
	type,
	id,
}: {
	value: string[][] | undefined;
	type: PanelType;
	id: string;
}) => {
	const JSONViewerStore = useJSONViewerStore();
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
							<th key={index}>
								{JSONViewerStore.compareTableResults(
									type,
									id,
									0,
									index,
									multiTokenSplit(key, JSONViewerStore.tokens),
								).map((contentPart, i) => (
									<span
										key={i}
										className={contentPart.token != null ? 'found-content' : undefined}
										style={{ backgroundColor: contentPart.token?.color }}>
										{contentPart.content}
									</span>
								))}
							</th>
						))}
						<th style={{ width: '16px' }}></th>
					</tr>
				</thead>
				<tbody>
					{rows.slice(0, shownSize).map((row, index) => (
						<tr key={index}>
							{row.slice(0, header.length).map((val, ind) => (
								<td key={ind}>
									{JSONViewerStore.compareTableResults(
										type,
										id,
										index + 1,
										ind,
										multiTokenSplit(
											typeof val === 'string' ? `"${val}"` : String(val),
											JSONViewerStore.tokens,
										),
									).map((contentPart, i) => (
										<span
											key={i}
											className={contentPart.token != null ? 'found-content' : undefined}
											style={{ backgroundColor: contentPart.token?.color }}>
											{contentPart.content}
										</span>
									))}
								</td>
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

export default observer(DisplayTable);

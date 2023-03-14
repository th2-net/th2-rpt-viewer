/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import '../../../styles/tables.scss';
import { ColumnSeparator } from './ColumnSeparator';

interface CustomTableProps {
	content: { [key: string]: string | number | null | undefined }[];
}

export function CustomTable({ content }: CustomTableProps) {
	const [columnWidth, setColumnWidth] = React.useState<number[]>(
		Object.keys(content[0]).map(() => 150),
	);
	if (!content || content.length < 1) {
		return null;
	}

	const changeWidth = (index: number, value: number) => {
		setColumnWidth([
			...columnWidth.slice(0, index),
			Math.max(columnWidth[index] + value, 150),
			...columnWidth.slice(index + 1),
		]);
	};

	const resetWidth = () => {
		setColumnWidth(Object.keys(content[0]).map(() => 150));
	};

	const headers = Object.keys(content[0]);

	return (
		<div className='user-table'>
			<div className='ver-table-header'>
				<div className='ver-table-header-control'>
					<span className='ver-table-header-control-button' onClick={resetWidth}>
						Reset columns&#39; width
					</span>
				</div>
			</div>
			<table
				style={{
					gridTemplateColumns: columnWidth.map(val => `${val}px 2px`).join(' '),
				}}>
				<thead>
					<tr>
						{headers.map((header, ind) => (
							<React.Fragment key={header}>
								<th>{header}</th>
								<ColumnSeparator index={ind} onChange={changeWidth} isHeader={true} />
							</React.Fragment>
						))}
					</tr>
				</thead>
				<tbody>
					{content.map((row, index) => (
						<tr key={index}>
							{headers.map((cell, ind) => (
								<React.Fragment key={row[cell] ?? index}>
									<td>{row[cell]}</td>
									<ColumnSeparator index={ind} onChange={changeWidth} isHeader={false} />
								</React.Fragment>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

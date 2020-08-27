/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import '../../styles/tables.scss';

interface CustomTableProps {
	content: {[key: string]: string | number | null | undefined}[];
}

export function CustomTable({ content }: CustomTableProps) {
	if (!content || content.length < 1) {
		return null;
	}

	const headers = Object.keys(content[0]);

	return (
		<div className="user-table">
			<table style={{
				gridTemplateColumns: `repeat(${headers.length}, minmax(150px, 250px))`,
			}}>
				<thead>
					{headers.map(header => <th key={header}>{header}</th>)}
				</thead>
				<tbody>
					{
						content.map((row, index) => (
							<tr key={index}>
								{headers.map(cell => <td key={row[cell] ?? index}>{row[cell]}</td>)}
							</tr>
						))
					}
				</tbody>
			</table>
		</div>
	);
}

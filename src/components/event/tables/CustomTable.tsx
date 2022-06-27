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

import { FilterEntry } from 'modules/search/stores/SearchStore';
import { wrapString } from 'helpers/filters';
import 'styles/tables.scss';

interface CustomTableProps {
	content: { [key: string]: string | number | null | undefined }[];
	filters: string[];
	target?: FilterEntry;
}

export function CustomTable({ content, filters, target }: CustomTableProps) {
	if (!content || content.length < 1) {
		return null;
	}

	const headers = Object.keys(content[0]);

	return (
		<div className='user-table'>
			<table
				style={{
					gridTemplateColumns: `repeat(${headers.length}, minmax(150px, auto))`,
				}}>
				<thead>
					<tr>
						{headers.map(header => (
							<th key={header}>{header}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{content.map((row, index) => (
						<tr key={index}>
							{headers.map(cell => {
								const value = row[cell];
								const inludingFilters = filters.filter(f => value?.toString().includes(f));

								const wrappedContent =
									value && inludingFilters.length
										? wrapString(
												value.toString(),
												inludingFilters.map(filter => ({
													type: new Set([
														target && index === parseInt(target.path[1]) && cell === target.path[2]
															? 'highlighted'
															: 'filtered',
													]),
													range: [value.toString().indexOf(filter), filter.length - 1],
												})),
										  )
										: value;

								return <td key={row[cell] ?? index}>{wrappedContent}</td>;
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

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

import { TableNode } from '../components/event/VerificationTable';
import {
	TreeTablePayload,
	TreeTableRow,
	VerificationPayload,
	VerificationPayloadField,
	TreeTableCollection,
} from '../models/EventActionPayload';
import { ParamsTable, ParamsTableRow } from '../components/event/ParamsTable';

export const getVerificationTablesNodes = (body: VerificationPayload) => {
	if (!body || !body.fields) return [];
	const result = Object.keys(body.fields)
		.map(field => paramsToNodes(body.fields[field], field));

	function paramsToNodes(root: VerificationPayloadField, name: string): TableNode {
		return ({
			subEntries: root.fields !== undefined
				? Object.keys(root.fields)
					.map(field => paramsToNodes(root.fields![field], field))
				: [],
			isExpanded: true,
			name,
			...root,
		});
	}

	return result;
};

export const extractParams = (body: TreeTablePayload): ParamsTable => {
	if (!body) return { rows: [], columns: [] };

	const { rows } = body;

	const tableColumns: Array<string> = [];

	const createRow = (
		row: TreeTableRow | TreeTableCollection,
		rowTitle: string,
		subRows: ParamsTableRow[] = [],
	): ParamsTableRow => {
		if (row.type === 'row') {
			Object.keys(row.columns)
				.forEach(columnTitle => !tableColumns.includes(columnTitle) && tableColumns.push(columnTitle));
		}
		return {
			title: rowTitle,
			columns: row.type === 'row' ? row.columns : undefined,
			isExpanded: subRows.length > 0,
			subRows,
		};
	};

	const tableRows = Object.keys(rows)
		.reduce<ParamsTableRow[]>((paramTableRows, rowTitle) => {
			const payloadItem = rows[rowTitle];
			if (payloadItem.type === 'row') {
				return [...paramTableRows, createRow(payloadItem, rowTitle)];
			}

			if (payloadItem.type === 'collection') {
				return [
					...paramTableRows,
					createRow(
						payloadItem,
						rowTitle,
						Object.keys(payloadItem.rows)
							.map(subRowTitle => createRow(payloadItem.rows[subRowTitle], subRowTitle)),
					),
				];
			}
			return paramTableRows;
		}, []);
	return { rows: tableRows, columns: tableColumns };
};

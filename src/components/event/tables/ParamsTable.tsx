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
import { createStyleSelector } from '../../../helpers/styleCreators';
import StateSaver from '../../util/StateSaver';
import '../../../styles/tables.scss';
import { ColumnSeparator } from './ColumnSeparator';

export interface ParamsTableRow {
	subRows: ParamsTableRow[];
	columns?: {
		[columnTitle: string]: string;
	};
	title: string;
	isExpanded: boolean;
}

export interface ParamsTable {
	rows: ParamsTableRow[];
	columns: Array<string>;
}

const PADDING_LEVEL_VALUE = 10;

interface OwnProps {
	columns: Array<string>;
	rows: ParamsTableRow[];
	name: string;
	stateKey: string;
}

interface StateProps {
	expandPath: number[];
}

interface RecoveredProps {
	nodes: ParamsTableRow[];
	saveState: (state: ParamsTableRow[]) => void;
}

interface Props extends Omit<OwnProps, 'params'>, StateProps, RecoveredProps {}

const ParamsTableBase = (props: Props) => {
	const [nodes, setNodes] = React.useState(props.nodes);
	const [columnWidth, setColumnWidth] = React.useState<number[]>(props.columns.map(() => 150));

	const findNode = (node: ParamsTableRow, targetNode: ParamsTableRow): ParamsTableRow => {
		if (node === targetNode) {
			return {
				...targetNode,
				isExpanded: !targetNode.isExpanded,
			};
		}

		return {
			...node,
			subRows: node.subRows && node.subRows.map(subNode => findNode(subNode, targetNode)),
		};
	};

	const setExpandStatus = (isCollapsed: boolean) => {
		setNodes(nodes.map(node => setNodeExpandStatus(node, isCollapsed)));
	};

	const setNodeExpandStatus = (node: ParamsTableRow, isExpanded: boolean): ParamsTableRow => ({
		...node,
		isExpanded,
		subRows: node.subRows.map(subNode => setNodeExpandStatus(subNode, isExpanded)),
	});

	const updateExpandPath = (
		[currentIndex, ...expandPath]: number[],
		prevState: ParamsTableRow[],
	): ParamsTableRow[] =>
		prevState.map((node, index) =>
			index === currentIndex
				? {
						...node,
						isExpanded: true,
						subParameters: node.subRows && updateExpandPath(expandPath, node.subRows),
				  }
				: node,
		);

	React.useEffect(() => () => props.saveState(nodes), []);

	React.useEffect(() => {
		if (props.expandPath && props.expandPath.length > 0) {
			setNodes(updateExpandPath(props.expandPath, nodes));
		}
	}, [props.expandPath]);

	const renderNodes = (node: ParamsTableRow, paddingLevel = 1, key = ''): React.ReactNodeArray => {
		if (node.subRows && node.subRows.length !== 0) {
			const subNodes = node.isExpanded
				? node.subRows.reduce(
						(list, n, index) => list.concat(renderNodes(n, paddingLevel + 1, `${key}-${index}`)),
						[] as React.ReactNodeArray,
				  )
				: [];

			return [renderTooglerNode(node, paddingLevel, key), ...subNodes];
		}
		return [renderValueNode(node.title, node.columns, paddingLevel, key)];
	};

	const renderValueNode = (
		rowTitle: string,
		columns: { [columnTitle: string]: string } = {},
		paddingLevel: number,
		key: string,
	): React.ReactNode => {
		const cellStyle = {
			paddingLeft: PADDING_LEVEL_VALUE * paddingLevel,
		};

		return (
			<tr className='params-table-row-value' key={key}>
				<td style={cellStyle}>{renderContent(`${key}-name`, rowTitle)}</td>
				{props.columns.map((columnTitle, ind) => (
					<React.Fragment key={`${rowTitle} - ${columnTitle}`}>
						<td>{renderContent(`${key}-value`, columns[columnTitle])}</td>
						<ColumnSeparator index={ind} onChange={changeWidth} isHeader={false} />
					</React.Fragment>
				))}
			</tr>
		);
	};

	const renderTooglerNode = (
		node: ParamsTableRow,
		paddingLevel: number,
		key: string,
	): React.ReactNode => {
		const rootClass = createStyleSelector(
			'params-table-row-toogler',
			node.isExpanded ? 'expanded' : 'collapsed',
		);
		const nameStyle = {
			paddingLeft: PADDING_LEVEL_VALUE * paddingLevel,
		};
		return (
			<tr className={rootClass} key={key} onClick={togglerClickHandler(node)}>
				<td style={{ gridColumn: `1 / ${props.columns.length * 2 + 2}` }}>
					<p style={nameStyle}>{renderContent(`${key}-name`, node.title)}</p>
				</td>
			</tr>
		);
	};

	/* 
		we need this for optimization - render SearchableContent component
		only if it contains some search results
	*/
	const renderContent = (contentKey: string, content: string): React.ReactNode => {
		if (typeof content === 'boolean' && (content as boolean))
			return <div className='boolean-value-cell' />;
		return content;
	};

	const togglerClickHandler = (targetNode: ParamsTableRow) => (e: React.MouseEvent) => {
		setNodes(nodes.map(node => findNode(node, targetNode)));

		e.stopPropagation();
	};

	const onControlButtonClick = (expandStatus: boolean) => (e: React.MouseEvent) => {
		setExpandStatus(expandStatus);
		e.stopPropagation();
	};

	const changeWidth = (index: number, value: number) => {
		setColumnWidth([
			...columnWidth.slice(0, index),
			Math.max(columnWidth[index] + value, 150),
			...columnWidth.slice(index + 1),
		]);
	};

	const resetWidth = () => {
		setColumnWidth(props.columns.map(() => 150));
	};

	return (
		<div className='params-table'>
			<div className='params-table-header'>
				<div className='params-table-header-control'>
					<span
						className='params-table-header-control-button'
						onClick={onControlButtonClick(false)}>
						Collapse
					</span>
					<span> | </span>
					<span className='params-table-header-control-button' onClick={onControlButtonClick(true)}>
						Expand
					</span>
					<span> | </span>
					<span className='params-table-header-control-button' onClick={resetWidth}>
						Reset columns&#39; width
					</span>
				</div>
			</div>
			<div className='params-table-wrapper'>
				<table
					style={{
						gridTemplateColumns: `1fr ${columnWidth.map(val => `${val}px 2px`).join(' ')}`,
					}}>
					<thead>
						<tr>
							<th />
							{props.columns.map((columnTitle, idx) => (
								<React.Fragment key={columnTitle}>
									<th key={columnTitle}>{columnTitle}</th>
									<ColumnSeparator index={idx} onChange={changeWidth} isHeader={true} />
								</React.Fragment>
							))}
						</tr>
					</thead>
					<tbody>{nodes.map(node => renderNodes(node, 1))}</tbody>
				</table>
			</div>
		</div>
	);
};

export const RecoverableParamsTable = ({
	stateKey,
	...props
}: OwnProps & StateProps & { stateKey: string }) => (
	// at first table render, we need to generate table nodes if we don't find previous table's state
	<StateSaver stateKey={stateKey} getDefaultState={() => props.rows}>
		{(state: ParamsTableRow[], stateSaver) => (
			<ParamsTableBase
				{...props}
				saveState={stateSaver}
				rows={state}
				nodes={state}
				stateKey={stateKey}
			/>
		)}
	</StateSaver>
);

export default RecoverableParamsTable;

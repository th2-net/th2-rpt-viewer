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

interface State {
	nodes: ParamsTableRow[];
}

class ParamsTableBase extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			nodes: props.nodes,
		};
	}

	findNode(node: ParamsTableRow, targetNode: ParamsTableRow): ParamsTableRow {
		if (node === targetNode) {
			return {
				...targetNode,
				isExpanded: !targetNode.isExpanded,
			};
		}

		return {
			...node,
			subRows: node.subRows && node.subRows.map(subNode => this.findNode(subNode, targetNode)),
		};
	}

	setExpandStatus(isCollapsed: boolean) {
		this.setState({
			nodes: this.state.nodes.map(node => this.setNodeExpandStatus(node, isCollapsed)),
		});
	}

	setNodeExpandStatus(node: ParamsTableRow, isExpanded: boolean): ParamsTableRow {
		return {
			...node,
			isExpanded,
			subRows: node.subRows.map(subNode => this.setNodeExpandStatus(subNode, isExpanded)),
		};
	}

	updateExpandPath(
		[currentIndex, ...expandPath]: number[],
		prevState: ParamsTableRow[],
	): ParamsTableRow[] {
		return prevState.map((node, index) =>
			index === currentIndex
				? {
						...node,
						isExpanded: true,
						subParameters: node.subRows && this.updateExpandPath(expandPath, node.subRows),
				  }
				: node,
		);
	}

	componentDidUpdate(prevProps: Props) {
		if (
			prevProps.expandPath !== this.props.expandPath &&
			this.props.expandPath &&
			this.props.expandPath.length > 0
		) {
			this.setState({
				nodes: this.updateExpandPath(this.props.expandPath, this.state.nodes),
			});
		}
	}

	componentWillUnmount() {
		this.props.saveState(this.state.nodes);
	}

	render() {
		return (
			<div className='params-table'>
				<div className='params-table-header'>
					<div className='params-table-header-control'>
						<span
							className='params-table-header-control-button'
							onClick={this.onControlButtonClick(false)}>
							Collapse
						</span>
						<span> | </span>
						<span
							className='params-table-header-control-button'
							onClick={this.onControlButtonClick(true)}>
							Expand
						</span>
					</div>
				</div>
				<div className='params-table-wrapper'>
					<table
						style={{
							gridTemplateColumns: `1fr repeat(${this.props.columns.length}, minmax(150px, 250px))`,
						}}>
						<thead>
							<tr>
								<th style={{ gridColumn: '1 / 2' }}></th>
								{this.props.columns.map((columnTitle, idx) => (
									<th style={{ gridColumn: `${idx + 2}/${idx + 3}` }} key={columnTitle}>
										{columnTitle}
									</th>
								))}
							</tr>
						</thead>
						<tbody>{this.state.nodes.map(nodes => this.renderNodes(nodes, 1))}</tbody>
					</table>
				</div>
			</div>
		);
	}

	private renderNodes(node: ParamsTableRow, paddingLevel = 1, key = ''): React.ReactNodeArray {
		if (node.subRows && node.subRows.length !== 0) {
			const subNodes = node.isExpanded
				? node.subRows.reduce(
						(list, n, index) =>
							list.concat(this.renderNodes(n, paddingLevel + 1, `${key}-${index}`)),
						[] as React.ReactNodeArray,
				  )
				: [];

			return [this.renderTooglerNode(node, paddingLevel, key), ...subNodes];
		}
		return [this.renderValueNode(node.title, node.columns, paddingLevel, key)];
	}

	private renderValueNode(
		rowTitle: string,
		columns: { [columnTitle: string]: string } = {},
		paddingLevel: number,
		key: string,
	): React.ReactNode {
		const cellStyle = {
			paddingLeft: PADDING_LEVEL_VALUE * paddingLevel,
		};

		return (
			<tr className='params-table-row-value' key={key}>
				<td style={cellStyle}>{this.renderContent(`${key}-name`, rowTitle)}</td>
				{this.props.columns.map(columnTitle => (
					<td key={`${rowTitle} - ${columnTitle}`}>
						{this.renderContent(`${key}-value`, columns[columnTitle])}
					</td>
				))}
			</tr>
		);
	}

	private renderTooglerNode(
		node: ParamsTableRow,
		paddingLevel: number,
		key: string,
	): React.ReactNode {
		const rootClass = createStyleSelector(
			'params-table-row-toogler',
			node.isExpanded ? 'expanded' : 'collapsed',
		);
		const nameStyle = {
			paddingLeft: PADDING_LEVEL_VALUE * paddingLevel,
		};
		return (
			<tr className={rootClass} key={key} onClick={this.togglerClickHandler(node)}>
				<td style={{ gridColumn: `1 / ${this.props.columns.length + 2}` }}>
					<p style={nameStyle}>{this.renderContent(`${key}-name`, node.title)}</p>
				</td>
			</tr>
		);
	}

	/* 
		we need this for optimization - render SearchableContent component
		only if it contains some search results
	*/
	private renderContent(contentKey: string, content: string): React.ReactNode {
		if (typeof content === 'boolean' && (content as boolean))
			return <div className='boolean-value-cell' />;
		return content;
	}

	private togglerClickHandler = (targetNode: ParamsTableRow) => (e: React.MouseEvent) => {
		this.setState({
			...this.state,
			nodes: this.state.nodes.map(node => this.findNode(node, targetNode)),
		});

		e.stopPropagation();
	};

	private onControlButtonClick = (expandStatus: boolean) => (e: React.MouseEvent) => {
		this.setExpandStatus(expandStatus);
		e.stopPropagation();
	};
}

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

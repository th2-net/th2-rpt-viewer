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
import { observer } from 'mobx-react-lite';
import VerificationEntry from '../../models/VerificationEntry';
import { StatusType, statusValues } from '../../models/Status';
import { createStyleSelector } from '../../helpers/styleCreators';
import StateSaver, { RecoverableElementProps } from '../util/StateSaver';
import SearchResult from '../../helpers/search/SearchResult';
import { replaceNonPrintableChars } from '../../helpers/stringUtils';
import { copyTextToClipboard } from '../../helpers/copyHandler';
import '../../styles/tables.scss';

const PADDING_LEVEL_VALUE = 6;

const STATUS_ALIASES = new Map<StatusType, { alias: string; className: string }>([
	[StatusType.FAILED, { alias: 'F', className: 'failed' }],
	[StatusType.PASSED, { alias: 'P', className: 'passed' }],
	[StatusType.CONDITIONALLY_PASSED, { alias: 'CP', className: 'conditionally_passed' }],
	[StatusType.NA, { alias: 'NA', className: 'na' }],
]);

interface OwnProps {
    actionId: number;
    messageId: number;
    params: VerificationEntry[];
    status: StatusType;
	keyPrefix: string;
	stateKey: string;
}

interface StateProps {
    precision: string;
    transparencyFilter: Set<StatusType>;
    visibilityFilter: Set<StatusType>;
    expandPath: number[];
    searchResults: SearchResult;
}

interface Props extends Omit<OwnProps, 'params'>, StateProps {
    nodes: TableNode[];
    stateSaver: (state: TableNode[]) => void;
}

interface RecoveredProps extends OwnProps, RecoverableElementProps, StateProps {
}

interface State {
    nodes: TableNode[];
}

interface TableNode extends VerificationEntry {
    // is subnodes visible
    isExpanded?: boolean;
}

class VerificationTableBase extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			nodes: props.nodes,
		};
	}

	findNode(node: TableNode, targetNode: TableNode): TableNode {
		if (node === targetNode) {
			return {
				...targetNode,
				isExpanded: !targetNode.isExpanded,
			};
		}

		return {
			...node,
			subEntries: node.subEntries && node.subEntries.map(subNode => this.findNode(subNode, targetNode)),
		};
	}

	setExpandStatus(isCollapsed: boolean) {
		this.setState({
			nodes: this.state.nodes.map(
				node => (node.subEntries ? this.setNodeExpandStatus(node, isCollapsed) : node),
			),
		});
	}

	setNodeExpandStatus(node: TableNode, isExpanded: boolean): TableNode {
		return {
			...node,
			isExpanded,
			subEntries: node.subEntries && node.subEntries.map(
				subNode => (subNode.subEntries ? this.setNodeExpandStatus(subNode, isExpanded) : subNode),
			),
		};
	}

	componentDidUpdate(prevProps: Props) {
		if (this.props.expandPath !== prevProps.expandPath && this.props.expandPath.length > 0) {
			this.setState({
				nodes: this.updateExpandPath(this.props.expandPath, this.state.nodes),
			});
		}
	}

	componentWillUnmount() {
		this.props.stateSaver(this.state.nodes);
	}

	updateExpandPath([currentIndex, ...expandPath]: number[], prevState: TableNode[]): TableNode[] {
		return prevState.map(
			(node, index): TableNode => (index === currentIndex ? {
				...node,
				isExpanded: true,
				subEntries: node.subEntries && this.updateExpandPath(expandPath, node.subEntries),
			} : node),
		);
	}

	render() {
		const { status, keyPrefix, precision } = this.props;
		const { nodes } = this.state;

		const rootClass = createStyleSelector('ver-table', status);

		if (!nodes.length) return null;

		return (
			<div className={rootClass}>
				<div className="ver-table-header">
					<div className="ver-table-header-control">
						<span className="ver-table-header-control-button"
							onClick={this.onControlButtonClick(false)}>
                            Collapse
						</span>
						<span> | </span>
						<span className="ver-table-header-control-button"
							onClick={this.onControlButtonClick(true)}>
                                Expand
						</span>
						<span> all groups</span>
					</div>
					<div className="ver-table-header-precision">
						<span className="ver-table-header-precision-value">{precision}</span>
					</div>
				</div>
				<table>
					<thead>
						<tr>
							<th className="ver-table-indicator transparent"></th>
							<th>Name</th>
							<th className="ver-table-flexible">Expected</th>
							<th className="ver-table-flexible">Actual</th>
							<th className="ver-table-status">Status</th>
							<th className="ver-table-flexible">Operation</th>
							<th className="ver-table-flexible">key</th>
						</tr>
					</thead>
					<tbody>
						{nodes.map((param, index) => this.renderTableNodes(param, `${keyPrefix}-${index}`))}
					</tbody>
				</table>
			</div>
		);
	}

	private renderTableNodes(node: TableNode, key: string, paddingLevel = 1): React.ReactNodeArray {
		if (node.status != null && !this.props.visibilityFilter.has(node.status)) {
			return [];
		}

		if (node.subEntries) {
			const subNodes = node.isExpanded
				? node.subEntries.reduce(
					(list, n, index) =>
						list.concat(
							this.renderTableNodes(n, `${key}-${index}`, paddingLevel + 1),
						), [] as React.ReactNodeArray,
				) : [];

			return [this.renderNode(node, paddingLevel, key), ...subNodes];
		}
		return [this.renderNode(node, paddingLevel, key)];
	}

	private renderNode(node: TableNode, paddingLevel: number, key: string): React.ReactNode {
		const { transparencyFilter } = this.props;
		const {
			name, expected, expectedType, actual, actualType, status, isExpanded, subEntries, hint,
			key: keyField, operation,
		} = node;

		const isToggler = subEntries != null && subEntries.length > 0;
		const isTransparent = status != null && !transparencyFilter.has(status);
		const hasHint = hint != null && hint !== '';
		const hasMismatchedTypes = expectedType != null && expectedType !== actualType;

		const expectedReplaced = replaceNonPrintableChars(expected);
		const actualReplaced = replaceNonPrintableChars(actual);

		const statusAlias = status && STATUS_ALIASES.has(status)
			? STATUS_ALIASES.get(status)! : { alias: status, className: '' };

		const rootClassName = createStyleSelector(
			'ver-table-row',
			statusAlias.className,
			isTransparent ? 'transparent' : null,
		);

		const statusClassName = createStyleSelector(
			'ver-table-row-status',
			statusAlias.className,
		);

		const togglerClassName = createStyleSelector(
			'ver-table-row-toggler',
			statusAlias.className,
			isExpanded ? 'expanded' : 'collapsed',
		);

		const actualClassName = createStyleSelector(
			'ver-table-row-actual',
			statusAlias.className,
		);

		const expectedClassName = createStyleSelector(
			'ver-table-row-expected',
			statusAlias.className,
		);

		const typeClassName = createStyleSelector(
			'ver-table-row-type',
			statusAlias.className,
			hasMismatchedTypes ? 'highlighted' : null,
		);

		const indicatorClassName = createStyleSelector(
			'ver-table-row-indicator',
			'transparent',
			hasHint ? 'active' : null,
		);

		const actualValueClassName = createStyleSelector(
			'ver-table-row-value',
			isToggler ? 'notype' : null,
		);

		const expectedValueClassName = createStyleSelector(
			'ver-table-row-value',
			isToggler ? 'notype' : null,
			expectedType == null && expected === 'null' ? 'novalue' : null,
		);

		return (
			<tr className={rootClassName} key={key}>
				<td className={indicatorClassName}>
					{ hasHint

						? (<div className="ver-table-row-hint">
							<div className="ver-table-row-hint-inner">{hint}</div>
						</div>)

						: null
					}
				</td>
				{
					isToggler ? (
						<td className={togglerClassName}
							onClick={this.onTogglerClick(node)}>
							<p style={{ marginLeft: PADDING_LEVEL_VALUE * (paddingLevel - 1) }}>
								{this.renderContent(`${key}-name`, name)}
							</p>
							<span className="ver-table-row-count">{subEntries.length}</span>
						</td>
					) : (
						<td
							className={statusAlias.className}
							style={{ paddingLeft: PADDING_LEVEL_VALUE * paddingLevel }}>
							{this.renderContent(`${key}-name`, name)}
						</td>
					)
				}
				<td className={expectedClassName} onCopy={this.onCopyFor(expected)}>
					<div className="ver-table-row-wrapper">
						{this.renderContent(`${key}-expected`, expected, expectedValueClassName, expectedReplaced)}
						{isToggler ? null : this.renderContent(`${key}-expectedType`, expectedType, typeClassName)}
					</div>
				</td>
				<td className={actualClassName} onCopy={this.onCopyFor(actual)}>
					<div className="ver-table-row-wrapper">
						{this.renderContent(`${key}-actual`, actual, actualValueClassName, actualReplaced)}
						{isToggler ? null : this.renderContent(`${key}-actualType`, actualType, typeClassName)}
					</div>
				</td>
				<td className={statusClassName}>
					{this.renderContent(`${key}-status`, statusAlias.alias as string)}
				</td>
				<td className={actualClassName} onCopy={this.onCopyFor(operation)}>
					<div className="ver-table-row-wrapper">
						{this.renderContent(`${key}-operation`, operation, statusClassName, operation)}
					</div>
				</td>
				<td className={statusClassName}>
					{this.renderContent(`${key}-key`, keyField.toString())}
				</td>
			</tr>
		);
	}

	/**
     * We need this for optimization - render SearchableContent component only if it contains some search results
     * @param contentKey for SearchableContent component
     * @param content
     * @param wrapperClassName - class name of the wrapping div (wrapper won't be rendered if class name is null)
     * @param fakeContent - this text will be rendered when there is no search results found -
     *     it's needed to render fake dots and squares instead of real non-printable characters
     */
	private renderContent(
		contentKey: string,
		content: string,
		wrapperClassName: string | null = null,
		fakeContent: string = content,
	): React.ReactNode {
		if (content == null) {
			return wrap(wrapperClassName, null);
		}

		if (!this.props.searchResults.isEmpty && this.props.searchResults.get(contentKey)) {
			return wrap(wrapperClassName, (
				<span>{content}</span>
			));
		}
		return wrap(wrapperClassName, fakeContent);


		function wrap(className: string | null, data: React.ReactNode): React.ReactNode {
			return className == null ? data : (
				<div className={className}>{data}</div>
			);
		}
	}

	private onCopyFor = (realText: string) => (e: React.ClipboardEvent<HTMLDivElement>) => {
		const selectionRange = window.getSelection()!.getRangeAt(0);
		const copiedText = realText.substring(selectionRange.startOffset, selectionRange.endOffset);

		e.preventDefault();
		copyTextToClipboard(copiedText);
	};

	private onTogglerClick = (targetNode: TableNode) => (e: React.MouseEvent) => {
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


export const RecoverableVerificationTable = ({ stateKey, ...props }: RecoveredProps) => (
	// at first table render, we need to generate table nodes if we don't find previous table's state
	<StateSaver
		stateKey={stateKey}
		getDefaultState={() => (props.params ? extractParams(props.params) : [])}>
		{
			(state: TableNode[], stateHandler) => (
				<VerificationTableBase
					{...props}
					stateKey={stateKey}
					nodes={state}
					stateSaver={stateHandler}/>
			)
		}
	</StateSaver>
);

function extractParams(body: any) {
	if (!body || !body.fields) return [];
	return Object.keys(body.fields)
		.map(field => extractTableParam(body, field))
		.map(paramsToNodes);
}

const extractTableParam = (body: any, field: string) => ({
	name: field,
	...body.fields[field],
});

function paramsToNodes(root: any): TableNode {
	return root.fields ? {
		...root,
		subEntries: Object.keys(root.fields)
			.map(field => paramsToNodes(extractTableParam(root, field))),
		isExpanded: true,
	} : root;
}

export const VerificationTable = observer(({ actionId, messageId, ...restProps }: OwnProps) => (
	<RecoverableVerificationTable
		precision=""
		transparencyFilter={new Set<StatusType>(statusValues)}
		visibilityFilter={new Set(statusValues)}
		expandPath={[] /** TODO: remove legacy search logic */}
		searchResults={new SearchResult()}
		actionId={actionId}
		messageId={messageId}
		{...restProps}/>
));

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
import ResizeObserver from 'resize-observer-polyfill';
import throttle from 'lodash.throttle';
import { observer } from 'mobx-react-lite';
import { EventStatus, eventStatusValues, StatusType } from '../../../models/Status';
import { createStyleSelector } from '../../../helpers/styleCreators';
import { getVerificationTablesNodes } from '../../../helpers/tables';
import StateSaver, { RecoverableElementProps } from '../../util/StateSaver';
import { replaceNonPrintableChars } from '../../../helpers/stringUtils';
import { copyTextToClipboard } from '../../../helpers/copyHandler';
import { VerificationPayload, VerificationPayloadField } from '../../../models/EventActionPayload';
import '../../../styles/tables.scss';
import Popover from '../../util/Popover';

const PADDING_LEVEL_VALUE = 10;

const STATUS_ALIASES = new Map<StatusType, { alias: string; className: string }>([
	[StatusType.FAILED, { alias: 'F', className: 'failed' }],
	[StatusType.PASSED, { alias: 'P', className: 'passed' }],
	[StatusType.CONDITIONALLY_PASSED, { alias: 'CP', className: 'conditionally_passed' }],
	[StatusType.NA, { alias: 'NA', className: 'na' }],
]);

interface OwnProps {
	payload: VerificationPayload;
	status: EventStatus;
	keyPrefix: string;
	stateKey: string;
}

interface StateProps {
	precision: string;
	transparencyFilter: Set<StatusType>;
	visibilityFilter: Set<StatusType>;
	expandPath: number[];
}

interface Props extends Omit<OwnProps, 'params'>, StateProps {
	nodes: TableNode[];
	stateSaver: (state: TableNode[]) => void;
}

interface RecoveredProps extends OwnProps, RecoverableElementProps, StateProps {}

interface State {
	nodes: TableNode[];
	prevColumns: Array<React.RefObject<HTMLTableHeaderCellElement>>;
	nextColumns: Array<React.RefObject<HTMLTableHeaderCellElement>>;
	tooltip: Tooltip;
}

interface Tooltip {
	target: HTMLElement | null;
	message: string;
	isOpen: boolean;
}

export interface TableNode extends VerificationPayloadField {
	isExpanded?: boolean;
	subEntries: TableNode[];
	name: string;
}

class VerificationTableBase extends React.Component<Props, State> {
	state: State = {
		nodes: this.props.nodes,
		prevColumns: [],
		nextColumns: [],
		tooltip: {
			target: null,
			message: '',
			isOpen: false,
		},
	};

	columnsRefs: Array<React.RefObject<HTMLTableHeaderCellElement>> = Array(7)
		.fill(null)
		.map(() => React.createRef());

	rootRef = React.createRef<HTMLDivElement>();

	resizeObserver: ResizeObserver | null = null;

	findNode(node: TableNode, targetNode: TableNode): TableNode {
		if (node === targetNode) {
			return {
				...targetNode,
				isExpanded: !targetNode.isExpanded,
			};
		}

		return {
			...node,
			subEntries:
				node.subEntries && node.subEntries.map(subNode => this.findNode(subNode, targetNode)),
		};
	}

	setExpandStatus(isCollapsed: boolean) {
		this.setState({
			nodes: this.state.nodes.map(node =>
				node.subEntries ? this.setNodeExpandStatus(node, isCollapsed) : node,
			),
		});
	}

	setNodeExpandStatus(node: TableNode, isExpanded: boolean): TableNode {
		return {
			...node,
			isExpanded,
			subEntries:
				node.subEntries &&
				node.subEntries.map(subNode =>
					subNode.subEntries ? this.setNodeExpandStatus(subNode, isExpanded) : subNode,
				),
		};
	}

	componentDidMount() {
		this.getHiddenColumns();

		this.resizeObserver = new ResizeObserver(() => this.getHiddenColumns());
		this.resizeObserver.observe(this.rootRef.current as HTMLDivElement);
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
		this.resizeObserver?.unobserve(this.rootRef.current as HTMLDivElement);
	}

	updateExpandPath([currentIndex, ...expandPath]: number[], prevState: TableNode[]): TableNode[] {
		return prevState.map(
			(node, index): TableNode =>
				index === currentIndex
					? {
							...node,
							isExpanded: true,
							subEntries: node.subEntries && this.updateExpandPath(expandPath, node.subEntries),
					  }
					: node,
		);
	}

	getHiddenColumns = () => {
		if (!this.rootRef.current) return;
		const { left, right } = this.rootRef.current.getBoundingClientRect();
		const prevColumns: Array<React.RefObject<HTMLTableHeaderCellElement>> = [];
		const nextColumns: Array<React.RefObject<HTMLTableHeaderCellElement>> = [];
		this.columnsRefs.forEach(col => {
			if (!col.current) return 0;
			const rect = col.current?.getBoundingClientRect();
			const isVisible = left <= rect.left && rect.left + rect.width * 0.9 <= right;
			if (!isVisible) {
				if (rect.left + rect.width > right) {
					nextColumns.push(col);
				} else {
					prevColumns.push(col);
				}
			}
			return 0;
		});
		this.setState({ prevColumns, nextColumns });
	};

	throttledGetHiddenColumns = throttle(this.getHiddenColumns, 20);

	onNextColumnCick = () => {
		const nextColumn = this.state.nextColumns[0]?.current;
		if (!nextColumn || !this.rootRef.current) return;
		const { left, width } = this.rootRef.current.getBoundingClientRect();
		const columnRect = nextColumn.getBoundingClientRect();
		this.rootRef.current.scrollLeft =
			columnRect.left + columnRect.width - left - width + this.rootRef.current.scrollLeft;
		this.getHiddenColumns();
	};

	onPrevColumnClick = () => {
		const prevColumn = this.state.prevColumns[this.state.prevColumns.length - 1]?.current;
		const rootRef = this.rootRef.current;
		if (!prevColumn || !rootRef) return;
		const { left } = rootRef.getBoundingClientRect();
		const columnRect = prevColumn.getBoundingClientRect();
		rootRef.scrollLeft -= left - columnRect.left;
		this.getHiddenColumns();
	};

	render() {
		const { status, keyPrefix, precision } = this.props;
		const { nodes, tooltip } = this.state;

		const rootClass = createStyleSelector('ver-table', status);

		if (!nodes.length) return null;
		return (
			<div className={rootClass}>
				<div className='ver-table__nav'>
					{this.state.prevColumns.length > 0 && (
						<button
							onClick={this.onPrevColumnClick}
							className='ver-table__button'
							style={{ gridArea: 'prev' }}>
							<span className='ver-table__button-icon'>
								<i className='ver-table__button-icon-prev'></i>
							</span>
							<span className='ver-table__button-label'>Previous</span>
							<span className='ver-table__counter'>{this.state.prevColumns.length}</span>
						</button>
					)}
					{this.state.nextColumns.length > 0 && (
						<button
							onClick={this.onNextColumnCick}
							className='ver-table__button'
							style={{ gridArea: 'next' }}>
							<span className='ver-table__counter'>{this.state.nextColumns.length}</span>
							<span className='ver-table__button-label'>Next</span>
							<span className='ver-table__button-icon'>
								<i className='ver-table__button-icon-next'></i>
							</span>
						</button>
					)}
				</div>
				<div className='ver-table-header'>
					<div className='ver-table-header-control'>
						<span
							className='ver-table-header-control-button'
							onClick={this.onControlButtonClick(false)}>
							Collapse
						</span>
						<span> | </span>
						<span
							className='ver-table-header-control-button'
							onClick={this.onControlButtonClick(true)}>
							Expand
						</span>
						<span> all groups</span>
					</div>
					<div className='ver-table-header-precision'>
						<span className='ver-table-header-precision-value'>{precision}</span>
					</div>
				</div>
				<div className='ver-table__wrapper' ref={this.rootRef} onScroll={this.getHiddenColumns}>
					<table>
						<thead>
							<tr>
								<th className='ver-table-flexible' ref={this.columnsRefs[0]}>
									Name
								</th>
								<th className='ver-table-expected' ref={this.columnsRefs[1]}>
									Expected
								</th>
								<th className='ver-table-actual' ref={this.columnsRefs[2]}>
									Actual
								</th>
								<th className='ver-table-status' ref={this.columnsRefs[3]}>
									Status
								</th>
								<th className='ver-table-operation' ref={this.columnsRefs[4]}>
									Operation
								</th>
								<th className='ver-table-key' ref={this.columnsRefs[5]}>
									Key
								</th>
								<th className='ver-table-hint' ref={this.columnsRefs[6]}>
									Hint
								</th>
							</tr>
						</thead>
						<tbody>
							{nodes.map((param, index) => this.renderTableNodes(param, `${keyPrefix}-${index}`))}
						</tbody>
					</table>
				</div>
				{tooltip && (
					<Popover
						isOpen={tooltip.isOpen}
						anchorEl={tooltip.target}
						onClickOutside={() => this.hideTooltip()}>
						<div className='ver-table__tooltip'>{tooltip.message}</div>
					</Popover>
				)}
			</div>
		);
	}

	private renderTableNodes(node: TableNode, key: string, paddingLevel = 1): React.ReactNodeArray {
		if (node.status != null && !this.props.visibilityFilter.has(node.status as any)) {
			return [];
		}

		if (node.subEntries) {
			const subNodes = node.isExpanded
				? node.subEntries.reduce(
						(list, n, index) =>
							list.concat(this.renderTableNodes(n, `${key}-${index}`, paddingLevel + 1)),
						[] as React.ReactNodeArray,
				  )
				: [];

			return [this.renderNode(node, paddingLevel, key), ...subNodes];
		}
		return [this.renderNode(node, paddingLevel, key)];
	}

	private renderNode(node: TableNode, paddingLevel: number, key: string): React.ReactNode {
		const { transparencyFilter } = this.props;
		const {
			name,
			expected,
			actual,
			status,
			isExpanded,
			subEntries,
			key: keyField,
			operation,
			hint,
		} = node;

		const isToggler = subEntries != null && subEntries.length > 0;
		const isTransparent = status != null && !transparencyFilter.has(status);
		const expectedReplaced = replaceNonPrintableChars(expected);
		const actualReplaced = replaceNonPrintableChars(actual);

		const statusAlias =
			status && STATUS_ALIASES.has(status)
				? STATUS_ALIASES.get(status)!
				: { alias: status, className: '' };

		const rootClassName = createStyleSelector(
			'ver-table-row',
			statusAlias.className,
			isTransparent ? 'transparent' : null,
			isToggler ? 'subheader' : null,
		);

		const statusClassName = createStyleSelector('ver-table-row-status', statusAlias.className);

		const statusWrapperClassName = createStyleSelector(
			'ver-table-status-wrapper',
			statusAlias.className,
		);

		const togglerClassName = createStyleSelector(
			'ver-table-row-toggler',
			statusAlias.className,
			isExpanded ? 'expanded' : 'collapsed',
		);

		const actualClassName = createStyleSelector('ver-table-row-actual', statusAlias.className);

		const expectedClassName = createStyleSelector('ver-table-row-expected', statusAlias.className);

		const typeClassName = createStyleSelector('ver-table-row-type', statusAlias.className);

		const actualValueClassName = createStyleSelector(
			'ver-table-row-value',
			isToggler ? 'notype' : null,
		);

		const expectedValueClassName = createStyleSelector(
			'ver-table-row-value',
			isToggler ? 'notype' : null,
		);

		const operationClassName = createStyleSelector('ver-table-row-operation', operation);

		const hintClassName = createStyleSelector('ver-table-row-hint', hint ? 'visible' : null);

		return (
			<tr className={rootClassName} key={key}>
				{isToggler ? (
					<td className={togglerClassName} onClick={this.onTogglerClick(node)}>
						<p style={{ marginLeft: PADDING_LEVEL_VALUE * (paddingLevel - 1) }}>
							{this.renderContent(`${key}-name`, name)}
						</p>
						<span className='ver-table-row-count'>{subEntries.length}</span>
						<div className='ver-table-row-spacer' />
						<div
							onClick={e => hint && this.showTooltip(e, hint)}
							title={hint}
							className='ver-table-row-wrapper inner'>
							{this.renderContent(`${key}-hint`, '', hintClassName)}
						</div>
					</td>
				) : (
					<td
						className={statusAlias.className}
						style={{ paddingLeft: PADDING_LEVEL_VALUE * paddingLevel }}>
						{this.renderContent(`${key}-name`, name)}
					</td>
				)}
				{!isToggler && (
					<>
						<td className={expectedClassName} onCopy={this.onCopyFor(expected)}>
							<div className='ver-table-row-wrapper'>
								{this.renderContent(
									`${key}-expected`,
									expected,
									expectedValueClassName,
									expectedReplaced,
								)}
								{isToggler ? null : this.renderContent(`${key}-expectedType`, '', typeClassName)}
							</div>
						</td>
						<td className={actualClassName} onCopy={this.onCopyFor(actual)}>
							<div className='ver-table-row-wrapper'>
								{this.renderContent(`${key}-actual`, actual, actualValueClassName, actualReplaced)}
								{this.renderContent(`${key}-actualType`, '', typeClassName)}
							</div>
						</td>
						<td className={statusClassName}>
							{this.renderContent(
								`${key}-status`,
								statusAlias.alias as string,
								statusWrapperClassName,
							)}
						</td>
						<td className={actualClassName} onCopy={this.onCopyFor(operation)}>
							<div className='ver-table-row-wrapper'>
								{this.renderContent(`${key}-operation`, '', operationClassName, '', true)}
							</div>
						</td>
						<td className={statusClassName}>{keyField && <div className='ver-table__check' />}</td>
						<td className={actualClassName}>
							<div
								onClick={e => hint && this.showTooltip(e, hint)}
								title={hint}
								className='ver-table-row-wrapper'>
								{this.renderContent(`${key}-hint`, '', hintClassName)}
							</div>
						</td>
					</>
				)}
			</tr>
		);
	}

	private hideTooltip(): void {
		this.setState({
			...this.state,
			tooltip: {
				target: null,
				message: '',
				isOpen: false,
			},
		});
	}

	private showTooltip(e: React.MouseEvent<HTMLDivElement>, message: string): void {
		this.setState({
			...this.state,
			tooltip: {
				target: e.currentTarget,
				message,
				isOpen: true,
			},
		});

		e.stopPropagation();
	}

	/**
	 * We need this for optimization - render SearchableContent component
	 * only if it contains some search results
	 * @param contentKey for SearchableContent component
	 * @param content
	 * @param wrapperClassName - class name of the wrapping div (wrapper won't be
	 * rendered if class name is null)
	 * @param fakeContent - this text will be rendered when there is no search results found -
	 *     it's needed to render fake dots and squares instead of real non-printable characters
	 * @param isEmpty - confirms the absence of content in the cells
	 */
	private renderContent(
		contentKey: string,
		content: string | null,
		wrapperClassName: string | null = null,
		fakeContent: string = content || '',
		isEmpty: Boolean = false,
	): React.ReactNode {
		if (content === null) {
			return wrap(createStyleSelector(wrapperClassName || '', 'novalue'), 'null');
		}

		if (content === '' && !isEmpty) {
			return content;
		}

		if (content === undefined) {
			return wrap(createStyleSelector(wrapperClassName || '', 'novalue'), 'missing value');
		}

		return wrap(wrapperClassName, fakeContent);

		function wrap(className: string | null, data: React.ReactNode): React.ReactNode {
			return className == null ? data : <div className={className}>{data}</div>;
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
	<StateSaver stateKey={stateKey} getDefaultState={() => getVerificationTablesNodes(props.payload)}>
		{(state: TableNode[], stateHandler) => (
			<VerificationTableBase
				{...props}
				stateKey={stateKey}
				nodes={state}
				stateSaver={stateHandler}
			/>
		)}
	</StateSaver>
);

export const VerificationTable = observer(({ ...restProps }: OwnProps) => (
	<RecoverableVerificationTable
		precision=''
		transparencyFilter={new Set<StatusType>(eventStatusValues)}
		visibilityFilter={new Set(eventStatusValues)}
		expandPath={[] /** TODO: remove legacy search logic */}
		{...restProps}
	/>
));

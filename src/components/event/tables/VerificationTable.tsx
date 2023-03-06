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
import { ColumnSeparator } from './ColumnSeparator';

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
	columnWidth: number[];
	columnMinWidth: number[];
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

const VerificationTableBase = (props: Props) => {
	const [state, setState] = React.useState<State>({
		nodes: props.nodes,
		prevColumns: [],
		nextColumns: [],
		tooltip: {
			target: null,
			message: '',
			isOpen: false,
		},
		columnWidth: [130, 125, 125, 60, 80, 50, 70],
		columnMinWidth: [130, 125, 125, 60, 80, 50, 70],
	});

	const columnsRefs: Array<React.RefObject<HTMLTableHeaderCellElement>> = Array(7)
		.fill(null)
		.map(() => React.createRef());

	const rootRef = React.createRef<HTMLDivElement>();

	const [resizeObserver, setResizeObserver] = React.useState<ResizeObserver | null>(null);

	const findNode = (node: TableNode, targetNode: TableNode): TableNode => {
		if (node === targetNode) {
			return {
				...targetNode,
				isExpanded: !targetNode.isExpanded,
			};
		}

		return {
			...node,
			subEntries: node.subEntries && node.subEntries.map(subNode => findNode(subNode, targetNode)),
		};
	};

	const setExpandStatus = (isCollapsed: boolean) => {
		setState({
			...state,
			nodes: state.nodes.map(node =>
				node.subEntries ? setNodeExpandStatus(node, isCollapsed) : node,
			),
		});
	};

	const setNodeExpandStatus = (node: TableNode, isExpanded: boolean): TableNode => ({
		...node,
		isExpanded,
		subEntries:
			node.subEntries &&
			node.subEntries.map(subNode =>
				subNode.subEntries ? setNodeExpandStatus(subNode, isExpanded) : subNode,
			),
	});

	React.useEffect(() => {
		getHiddenColumns();

		setResizeObserver(new ResizeObserver(() => getHiddenColumns()));
		if (resizeObserver) resizeObserver.observe(rootRef.current as HTMLDivElement);

		return () => {
			props.stateSaver(state.nodes);
			resizeObserver?.unobserve(rootRef.current as HTMLDivElement);
		};
	}, []);

	React.useEffect(() => {
		if (props.expandPath.length > 0) {
			setState({
				...state,
				nodes: updateExpandPath(props.expandPath, state.nodes),
			});
		}
	}, [props.expandPath]);

	const updateExpandPath = (
		[currentIndex, ...expandPath]: number[],
		prevState: TableNode[],
	): TableNode[] =>
		prevState.map(
			(node, index): TableNode =>
				index === currentIndex
					? {
							...node,
							isExpanded: true,
							subEntries: node.subEntries && updateExpandPath(expandPath, node.subEntries),
					  }
					: node,
		);

	const getHiddenColumns = () => {
		if (!rootRef.current) return;
		const { left, right } = rootRef.current.getBoundingClientRect();
		const prevColumns: Array<React.RefObject<HTMLTableHeaderCellElement>> = [];
		const nextColumns: Array<React.RefObject<HTMLTableHeaderCellElement>> = [];
		columnsRefs.forEach(col => {
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
		setState({ ...state, prevColumns, nextColumns });
	};

	const changeWidth = (index: number, value: number) => {
		setState({
			...state,
			columnWidth: [
				...state.columnWidth.slice(0, index),
				Math.max(state.columnWidth[index] + value, state.columnMinWidth[index]),
				...state.columnWidth.slice(index + 1),
			],
		});
	};

	const renderTableNodes = (
		node: TableNode,
		key: string,
		paddingLevel = 1,
	): React.ReactNodeArray => {
		if (node.status != null && !props.visibilityFilter.has(node.status as any)) {
			return [];
		}

		if (node.subEntries) {
			const subNodes = node.isExpanded
				? node.subEntries.reduce(
						(list, n, index) =>
							list.concat(renderTableNodes(n, `${key}-${index}`, paddingLevel + 1)),
						[] as React.ReactNodeArray,
				  )
				: [];

			return [renderNode(node, paddingLevel, key), ...subNodes];
		}
		return [renderNode(node, paddingLevel, key)];
	};

	const renderNode = (node: TableNode, paddingLevel: number, key: string): React.ReactNode => {
		const { transparencyFilter } = props;
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
					<td className={togglerClassName} onClick={onTogglerClick(node)}>
						<p style={{ marginLeft: PADDING_LEVEL_VALUE * (paddingLevel - 1) }}>
							{renderContent(`${key}-name`, name)}
						</p>
						<span className='ver-table-row-count'>{subEntries.length}</span>
						<div className='ver-table-row-spacer' />
						<div
							onClick={e => hint && showTooltip(e, hint)}
							title={hint}
							className='ver-table-row-wrapper inner'>
							{renderContent(`${key}-hint`, '', hintClassName)}
						</div>
					</td>
				) : (
					<>
						<td
							className={statusAlias.className}
							style={{ paddingLeft: PADDING_LEVEL_VALUE * paddingLevel }}>
							{renderContent(`${key}-name`, name)}
						</td>
						<ColumnSeparator index={0} onChange={changeWidth} isHeader={false} />
					</>
				)}
				{!isToggler && (
					<>
						<td className={expectedClassName} onCopy={onCopyFor(expected)}>
							<div className='ver-table-row-wrapper'>
								{renderContent(
									`${key}-expected`,
									expected,
									expectedValueClassName,
									expectedReplaced,
								)}
								{isToggler ? null : renderContent(`${key}-expectedType`, '', typeClassName)}
							</div>
						</td>
						<ColumnSeparator index={1} onChange={changeWidth} isHeader={false} />
						<td className={actualClassName} onCopy={onCopyFor(actual)}>
							<div className='ver-table-row-wrapper'>
								{renderContent(`${key}-actual`, actual, actualValueClassName, actualReplaced)}
								{renderContent(`${key}-actualType`, '', typeClassName)}
							</div>
						</td>
						<ColumnSeparator index={2} onChange={changeWidth} isHeader={false} />
						<td className={statusClassName}>
							{renderContent(`${key}-status`, statusAlias.alias as string, statusWrapperClassName)}
						</td>
						<ColumnSeparator index={3} onChange={changeWidth} isHeader={false} />
						<td className={actualClassName} onCopy={onCopyFor(operation)}>
							<div className='ver-table-row-wrapper'>
								{renderContent(`${key}-operation`, '', operationClassName, '', true)}
							</div>
						</td>
						<ColumnSeparator index={4} onChange={changeWidth} isHeader={false} />
						<td className={statusClassName}>{keyField && <div className='ver-table__check' />}</td>
						<ColumnSeparator index={5} onChange={changeWidth} isHeader={false} />
						<td className={actualClassName}>
							<div
								onClick={e => hint && showTooltip(e, hint)}
								title={hint}
								className='ver-table-row-wrapper'>
								{renderContent(`${key}-hint`, '', hintClassName)}
							</div>
						</td>
						<ColumnSeparator index={6} onChange={changeWidth} isHeader={false} />
					</>
				)}
			</tr>
		);
	};

	const hideTooltip = (): void => {
		setState({
			...state,
			tooltip: {
				target: null,
				message: '',
				isOpen: false,
			},
		});
	};

	const showTooltip = (e: React.MouseEvent<HTMLDivElement>, message: string): void => {
		setState({
			...state,
			tooltip: {
				target: e.currentTarget,
				message,
				isOpen: true,
			},
		});

		e.stopPropagation();
	};

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
	const renderContent = (
		contentKey: string,
		content: string | null,
		wrapperClassName: string | null = null,
		fakeContent: string = content || '',
		isEmpty: Boolean = false,
	): React.ReactNode => {
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
	};

	const onCopyFor = (realText: string) => (e: React.ClipboardEvent<HTMLDivElement>) => {
		const selectionRange = window.getSelection()!.getRangeAt(0);
		const copiedText = realText.substring(selectionRange.startOffset, selectionRange.endOffset);

		e.preventDefault();
		copyTextToClipboard(copiedText);
	};

	const onTogglerClick = (targetNode: TableNode) => (e: React.MouseEvent) => {
		setState({
			...state,
			nodes: state.nodes.map(node => findNode(node, targetNode)),
		});

		e.stopPropagation();
	};

	const onControlButtonClick = (expandStatus: boolean) => (e: React.MouseEvent) => {
		setExpandStatus(expandStatus);
		e.stopPropagation();
	};

	const rootClass = createStyleSelector('ver-table', props.status);

	const resetWidth = () => {
		setState({
			...state,
			columnWidth: [130, 125, 125, 60, 80, 50, 70],
		});
	};

	if (!state.nodes.length) return null;
	return (
		<div className={rootClass}>
			<div className='ver-table-header'>
				<div className='ver-table-header-control'>
					<span className='ver-table-header-control-button' onClick={onControlButtonClick(false)}>
						Collapse
					</span>
					<span> | </span>
					<span className='ver-table-header-control-button' onClick={onControlButtonClick(true)}>
						Expand
					</span>
					<span> all groups </span>
					<span> | </span>
					<span className='ver-table-header-control-button' onClick={resetWidth}>
						Reset
					</span>
					<span> columns&#39; width </span>
				</div>
				<div className='ver-table-header-precision'>
					<span className='ver-table-header-precision-value'>{props.precision}</span>
				</div>
			</div>
			<div className='ver-table__wrapper' ref={rootRef} onScroll={getHiddenColumns}>
				<table
					style={{
						gridTemplateColumns: state.columnWidth.map(val => `${val}px 2px`).join(' '),
					}}>
					<thead>
						<tr>
							<th className='ver-table-flexible' ref={columnsRefs[0]}>
								Name
							</th>
							<ColumnSeparator index={0} onChange={changeWidth} isHeader={true} />
							<th className='ver-table-expected' ref={columnsRefs[1]}>
								Expected
							</th>
							<ColumnSeparator index={1} onChange={changeWidth} isHeader={true} />
							<th className='ver-table-actual' ref={columnsRefs[2]}>
								Actual
							</th>
							<ColumnSeparator index={2} onChange={changeWidth} isHeader={true} />
							<th className='ver-table-status' ref={columnsRefs[3]}>
								Status
							</th>
							<ColumnSeparator index={3} onChange={changeWidth} isHeader={true} />
							<th className='ver-table-operation' ref={columnsRefs[4]}>
								Operation
							</th>
							<ColumnSeparator index={4} onChange={changeWidth} isHeader={true} />
							<th className='ver-table-key' ref={columnsRefs[5]}>
								Key
							</th>
							<ColumnSeparator index={5} onChange={changeWidth} isHeader={true} />
							<th className='ver-table-hint' ref={columnsRefs[6]}>
								Hint
							</th>
							<ColumnSeparator index={6} onChange={changeWidth} isHeader={true} />
						</tr>
					</thead>
					<tbody>
						{state.nodes.map((param, index) =>
							renderTableNodes(param, `${props.keyPrefix}-${index}`),
						)}
					</tbody>
				</table>
			</div>
			{state.tooltip && (
				<Popover
					isOpen={state.tooltip.isOpen}
					anchorEl={state.tooltip.target}
					onClickOutside={() => hideTooltip()}>
					<div className='ver-table__tooltip'>{state.tooltip.message}</div>
				</Popover>
			)}
		</div>
	);
};

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

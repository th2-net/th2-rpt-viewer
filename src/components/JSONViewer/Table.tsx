import React, { useEffect, useMemo } from 'react';
import { TableVirtuoso, VirtuosoHandle } from 'react-virtuoso';
import { SimpleField, TreeNode, TreeViewType } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import DetailedMessageRaw from '../message/message-card/raw/DetailedMessageRaw';
import { decodeBase64RawContent } from '../../helpers/rawFormatter';
import SimpleMessageRaw from '../message/message-card/raw/SimpleMessageRaw';
import LeafTools from './LeafTools';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import StateSaverProvider from '../util/StateSaverProvider';

const Table = ({
	scrollTop,
	type,
	onScroll,
}: {
	scrollTop: number;
	type: 'select' | 'compare';
	onScroll: (e: React.UIEvent<'div'>) => void;
}) => {
	const JSONViewerStore = useJSONViewerStore();
	const [rowsToRender, setRowsToRender] = React.useState(
		type === 'select' ? JSONViewerStore.getShownSelectRows : JSONViewerStore.getShownCompareRows,
	);
	const virtuoso = React.useRef<VirtuosoHandle>(null);

	const toggleNode = (nodeId: string) => {
		if (type === 'select') {
			if (JSONViewerStore.openSelectedRows.has(nodeId)) {
				JSONViewerStore.closeSelectRow(nodeId);
			} else {
				JSONViewerStore.openSelectRow(nodeId);
			}
			setRowsToRender(JSONViewerStore.getShownSelectRows);
		} else {
			if (JSONViewerStore.openComparableRows.has(nodeId)) {
				JSONViewerStore.closeCompareRow(nodeId);
			} else {
				JSONViewerStore.openCompareRow(nodeId);
			}
			setRowsToRender(JSONViewerStore.getShownCompareRows);
		}
	};

	useEffect(() => {
		if (virtuoso.current) {
			virtuoso.current.scrollTo({
				top: scrollTop,
			});
		}
	}, [virtuoso, scrollTop]);

	useEffect(() => {
		if (type === 'select') {
			setRowsToRender(JSONViewerStore.getShownSelectRows);
		}
	}, [JSONViewerStore.selectedTreeNode.id]);

	useEffect(() => {
		if (type === 'compare') {
			setRowsToRender(JSONViewerStore.getShownCompareRows);
		}
	}, [JSONViewerStore.comparableTreeNode.id]);

	const computeRowKey = React.useCallback(
		(index: number, row: TreeNode | SimpleField) => row.id,
		[],
	);

	const renderRow = React.useCallback((index: number, row: TreeNode | SimpleField) => {
		if ('complexFields' in row)
			return (
				<ExpandRow
					field={row}
					isOpen={
						type === 'select'
							? JSONViewerStore.openSelectedRows.has(row.id)
							: JSONViewerStore.openComparableRows.has(row.id)
					}
					setOpen={toggleNode}
				/>
			);
		return <SimpleRow field={row} />;
	}, []);

	return (
		<StateSaverProvider>
			<TableVirtuoso
				ref={virtuoso}
				onScroll={onScroll}
				className='json-table'
				style={{ height: '100%' }}
				fixedHeaderContent={() => (
					<tr>
						<th style={{ width: `30%` }} key='fieldKey'>
							fieldKey
						</th>
						<th style={{ width: `70%` }} key='fieldValue'>
							fieldValue
						</th>
					</tr>
				)}
				data={rowsToRender}
				computeItemKey={computeRowKey}
				overscan={3}
				itemContent={renderRow}
			/>
		</StateSaverProvider>
	);
};

const Base64Cell = ({ value }: { value: string }) => {
	const [viewType, setViewType] = React.useState(TreeViewType.ASCII);
	const viewTypes = [TreeViewType.ORIGIN, TreeViewType.BINARY, TreeViewType.ASCII];

	switch (viewType) {
		case TreeViewType.ASCII:
			return (
				<div className='json-table-Base64Cell'>
					<SimpleMessageRaw rawContent={value} />
					<LeafTools activeViewType={viewType} toggleViewType={setViewType} viewTypes={viewTypes} />
				</div>
			);
		case TreeViewType.BINARY:
			return (
				<div className='json-table-Base64Cell'>
					<DetailedMessageRaw rawContent={value} />
					<LeafTools activeViewType={viewType} toggleViewType={setViewType} viewTypes={viewTypes} />
				</div>
			);
		case TreeViewType.ORIGIN:
			return (
				<div className='json-table-Base64Cell'>
					<div style={{ overflowWrap: 'anywhere' }}>
						<p>{String(value)}</p>
					</div>
					<LeafTools activeViewType={viewType} toggleViewType={setViewType} viewTypes={viewTypes} />
				</div>
			);
		default:
			return <></>;
	}
};

const SimpleRow = ({ field }: { field: SimpleField }) => {
	const { key, value, parentIds } = field;

	const getValue = () => {
		if (key.endsWith('Base64')) {
			try {
				decodeBase64RawContent(value);
				return <Base64Cell value={value} />;
			} catch (error) {
				return (
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<p style={{ color: 'red' }}>Failed to decode Base64:</p>
						<p>{String(value)}</p>
					</div>
				);
			}
		}
		if (typeof value === 'object') return <p>{JSON.stringify(value)}</p>;
		return <p>{typeof value === 'string' ? `"${value}"` : String(value)}</p>;
	};

	return (
		<>
			{value === '' ? (
				<td
					className={'json-table-row-value'}
					colSpan={2}
					style={{
						paddingLeft: `${parentIds ? (parentIds.length - 1) * 10 : 0}px`,
						overflowWrap: 'anywhere',
					}}>
					<p>{key}</p>
				</td>
			) : (
				<>
					<td
						className={'json-table-row-value'}
						style={{
							width: `30%`,
							paddingLeft: `${parentIds ? (parentIds.length - 1) * 10 : 0}px`,
							overflowWrap: 'anywhere',
						}}>
						<p>{key}</p>
					</td>
					<td className={'json-table-row-value'} style={{ width: `70%`, overflowWrap: 'anywhere' }}>
						{getValue()}
					</td>
				</>
			)}
		</>
	);
};

const ExpandRow = ({
	field,
	isOpen,
	setOpen,
}: {
	field: TreeNode;
	isOpen: boolean;
	setOpen: (id: string) => void;
}) => {
	const nodeName = useMemo(() => {
		if (field.displayName) return field.displayName;
		if (field.key && !(field.isGeneratedKey && !field.isRoot)) return field.key;
		return 'no display name';
	}, [field.displayName, field.key, field.isGeneratedKey]);

	return (
		<>
			<td
				className={'json-table-row-togler'}
				style={{
					gridColumn: `1/3`,
					paddingLeft: `${field.parentIds.length * 10}px`,
				}}
				colSpan={2}
				onClick={() => setOpen(field.id)}>
				<div className='leafWrapper'>
					<div className={createBemBlock('expand-icon', isOpen ? 'expanded' : 'hidden')} />
					<div className={'valueLeaf-table'} title={nodeName}>
						{nodeName}
					</div>
				</div>
			</td>
		</>
	);
};

export default Table;

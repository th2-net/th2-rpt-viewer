import React, { useMemo } from 'react';
import { TableVirtuoso, VirtuosoHandle } from 'react-virtuoso';
import { observer } from 'mobx-react-lite';
import { SimpleField, TreeNode, TreeViewType } from '../../models/JSONSchema';
import { createBemBlock } from '../../helpers/styleCreators';
import DetailedMessageRaw from '../message/message-card/raw/DetailedMessageRaw';
import { decodeBase64RawContent } from '../../helpers/rawFormatter';
import SimpleMessageRaw from '../message/message-card/raw/SimpleMessageRaw';
import LeafTools from './LeafTools';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import StateSaverProvider from '../util/StateSaverProvider';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import SearchToken from '../../models/search/SearchToken';
import { getKeyValueTokens } from '../../helpers/search/getSpecificTokens';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import DisplayTable from './DisplayTable';

const Table = ({ type }: { type: PanelType }) => {
	const JSONViewerStore = useJSONViewerStore();
	const [rowsToRender, setRowsToRender] = React.useState(JSONViewerStore.shownSelectRows[type]);

	React.useEffect(() => {
		setRowsToRender(JSONViewerStore.shownSelectRows[type]);
	}, [JSONViewerStore.shownSelectRows]);

	const virtuoso = React.useRef<VirtuosoHandle>(null);

	const toggleNode = (nodeId: string) => {
		if (JSONViewerStore.openSelectedRows[type].has(nodeId)) {
			JSONViewerStore.closeSelectRow(nodeId, type);
		} else {
			JSONViewerStore.openSelectRow(nodeId, type);
		}
	};

	const computeRowKey = React.useCallback(
		(index: number, row: TreeNode | SimpleField) => row.id,
		[],
	);

	const renderRow = React.useCallback(
		(index: number, row: TreeNode | SimpleField) => {
			if ('complexFields' in row) {
				const rowName = row.displayName
					? row.displayName
					: row.key && !(row.isGeneratedKey && !row.isRoot)
					? row.key
					: 'no display name';
				if (rowName.endsWith('-table'))
					return <TableRow type={type} field={row} tokens={JSONViewerStore.tokens} />;
				return (
					<ExpandRow
						field={row}
						isOpen={JSONViewerStore.openSelectedRows[type].has(row.id)}
						setOpen={toggleNode}
						tokens={JSONViewerStore.tokens}
					/>
				);
			}

			return <SimpleRow field={row} tokens={JSONViewerStore.tokens} />;
		},
		[JSONViewerStore.tokens],
	);

	return (
		<StateSaverProvider>
			<TableVirtuoso
				ref={virtuoso}
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

const Base64Cell = ({ value, valueTokens }: { value: string; valueTokens: SearchToken[] }) => {
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
						<p>
							{multiTokenSplit(String(value), valueTokens).map((contentPart, index) => (
								<span
									key={index}
									className={contentPart.token != null ? 'found-content' : undefined}
									style={{ backgroundColor: contentPart.token?.color }}>
									{contentPart.content}
								</span>
							))}
						</p>
					</div>
					<LeafTools activeViewType={viewType} toggleViewType={setViewType} viewTypes={viewTypes} />
				</div>
			);
		default:
			return <></>;
	}
};

const SimpleRow = ({ field, tokens }: { field: SimpleField; tokens: SearchToken[] }) => {
	const valueString =
		typeof field.value === 'object'
			? JSON.stringify(field.value)
			: typeof field.value === 'string' && !field.key.endsWith('Base64')
			? `"${field.value}"`
			: String(field.value);

	const keyValueTokens = getKeyValueTokens(tokens).filter(
		({ isOne, keyToken, valueToken }) =>
			!isOne ||
			(field.key.endsWith(keyToken.pattern) && valueString.startsWith(valueToken.pattern)),
	);

	const keyTokens = keyValueTokens.map(({ keyToken }) => keyToken);
	const valueTokens = keyValueTokens.map(({ valueToken }) => valueToken);

	const { key, value, parentIds } = field;

	const getValue = () => {
		if (key.endsWith('Base64')) {
			try {
				decodeBase64RawContent(value);
				return <Base64Cell value={value} valueTokens={valueTokens} />;
			} catch (error) {
				return (
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<p style={{ color: 'red' }}>Failed to decode Base64:</p>
						<p>{String(value)}</p>
					</div>
				);
			}
		}
		return (
			<p>
				{multiTokenSplit(valueString, valueTokens).map((contentPart, index) => (
					<span
						key={index}
						className={contentPart.token != null ? 'found-content' : undefined}
						style={{ backgroundColor: contentPart.token?.color }}>
						{contentPart.content}
					</span>
				))}
			</p>
		);
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
					<p>
						{multiTokenSplit(key, keyTokens).map((contentPart, index) => (
							<span
								key={index}
								className={contentPart.token != null ? 'found-content' : undefined}
								style={{ backgroundColor: contentPart.token?.color }}>
								{contentPart.content}
							</span>
						))}
					</p>
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
						<p>
							{multiTokenSplit(key, keyTokens).map((contentPart, index) => (
								<span
									key={index}
									className={contentPart.token != null ? 'found-content' : undefined}
									style={{ backgroundColor: contentPart.token?.color }}>
									{contentPart.content}
								</span>
							))}
						</p>
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
	tokens,
}: {
	field: TreeNode;
	isOpen: boolean;
	setOpen: (id: string) => void;
	tokens: SearchToken[];
}) => {
	const nodeName = useMemo(() => {
		if (field.displayName) return field.displayName;
		if (field.key && !(field.isGeneratedKey && !field.isRoot)) return field.key;
		return 'no display name';
	}, [field.displayName, field.key, field.isGeneratedKey]);

	const splitContent = multiTokenSplit(nodeName, tokens);

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
						{splitContent.map((contentPart, index) => (
							<span
								key={index}
								className={contentPart.token != null ? 'found-content' : undefined}
								style={{ backgroundColor: contentPart.token?.color }}>
								{contentPart.content}
							</span>
						))}
					</div>
				</div>
			</td>
		</>
	);
};

const TableRow = ({
	field,
	tokens,
	type,
}: {
	field: TreeNode;
	tokens: SearchToken[];
	type: PanelType;
}) => {
	const [isTableOpen, setTableOpen] = React.useState(false);
	const nodeName = useMemo(() => {
		if (field.displayName) return field.displayName;
		if (field.key && !(field.isGeneratedKey && !field.isRoot)) return field.key;
		return 'no display name';
	}, [field.displayName, field.key, field.isGeneratedKey]);

	const fields = field.simpleFields.map(({ value }) =>
		Array.isArray(value) ? value.map(v => String(v)) : false,
	);
	const fieldsFiltered = fields.filter(value => Array.isArray(value));

	const toggleOpen = () => {
		setTableOpen(!isTableOpen);
	};

	const splitContent = multiTokenSplit(nodeName, tokens);

	return (
		<>
			<td
				className={'json-table-row-togler'}
				style={{
					gridColumn: `1/3`,
					paddingLeft: `${field.parentIds.length * 10}px`,
				}}
				colSpan={2}
				onClick={toggleOpen}>
				<div className='leafWrapper'>
					<div className={createBemBlock('expand-icon', isTableOpen ? 'expanded' : 'hidden')} />
					<div className={'valueLeaf-table'} title={nodeName}>
						{splitContent.map((contentPart, index) => (
							<span
								key={index}
								className={contentPart.token != null ? 'found-content' : undefined}
								style={{ backgroundColor: contentPart.token?.color }}>
								{contentPart.content}
							</span>
						))}
					</div>
				</div>
				{isTableOpen && <DisplayTable type={type} value={fieldsFiltered} id={field.id} />}
			</td>
		</>
	);
};

export default observer(Table);

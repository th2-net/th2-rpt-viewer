import React from 'react';
import { Tree, ViewInstruction } from '../../models/JSONSchema';
import { isSimpleLeaf } from '../../helpers/JSONViewer';
import { createBemBlock } from '../../helpers/styleCreators';
import Table from './Table';
import '../../styles/JSONviewer.scss';

const TablePanel = ({ node: [nodeKey, nodeTree] }: { node: [string, Tree] }) => {
	const failed = nodeKey
		? nodeKey.includes('[fail]') || nodeKey.trim().indexOf('#') === 0
		: undefined;
	const display = nodeTree.view_instruction;
	const leafs = Object.entries(nodeTree);
	const simpleLeafs: [string, string | number | string[]][] = [];
	const complexLeafs: [string, Tree][] = [];
	const combLeafs: [string, Tree | string | number | string[]][] = [];
	leafs.forEach(([key, value]) => {
		if (!value) return;
		if (key === 'view_instruction') return;
		if (isSimpleLeaf(value)) {
			const v = key === 'raw' && Array.isArray(value) ? atob(String(value[0])) : value;
			simpleLeafs.push([key, v]);
			combLeafs.push([key, v]);
			return;
		}
		if (display === ViewInstruction.summaryAndTree) {
			simpleLeafs.push([key, '']);
			combLeafs.push([key, '']);
		}
		complexLeafs.push([key, value]);
		combLeafs.push([key, value]);
	});

	return (
		<>
			{nodeKey !== '' && (
				<div
					className={createBemBlock('valueLeaf', failed ? 'failed' : 'passed', 'selected')}
					style={{ cursor: 'default' }}
					title={nodeKey}>
					<div className={createBemBlock('event-status-icon', failed ? 'failed' : 'passed')} />
					{nodeKey}
				</div>
			)}
			{display === 'table' ? (
				<>
					<Table rows={combLeafs} />
					<br />
				</>
			) : (
				<>
					{simpleLeafs.length > 0 && (
						<>
							<Table rows={simpleLeafs} />
							<br />
						</>
					)}
				</>
			)}
		</>
	);
};

export default TablePanel;

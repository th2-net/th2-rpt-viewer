import React from 'react';
import { createBemBlock } from '../../helpers/styleCreators';
import { Tree, ViewInstruction } from '../../models/Parser';
import { isSimpleLeaf } from '../../helpers/parser';
import ParserTable from './ParserTable';
import '../../styles/parser.scss';

const ParserTablePanel = ({ node: [nodeKey, nodeTree] }: { node: [string, Tree] }) => {
	const failed = nodeKey
		? nodeKey.includes('[fail]') || nodeKey.trim().indexOf('#') === 0
		: undefined;
	const display = nodeTree.view_instruction;
	const leafs = Object.entries(nodeTree);
	const simpleLeafs: [string, string | string[]][] = [];
	const complexLeafs: [string, Tree][] = [];
	const combLeafs: [string, Tree | string | string[]][] = [];
	leafs.forEach(([key, value]) => {
		if (!value) return;
		if (key === 'view_instruction') return;
		if (isSimpleLeaf(value)) {
			const v = key === 'raw' ? atob(String(value[0])) : value;
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
					<div
						className={createBemBlock('event-status-icon', 'active', failed ? 'failed' : 'passed')}
					/>
					{nodeKey}
				</div>
			)}
			{display === 'table' ? (
				<ParserTable rows={combLeafs} />
			) : (
				<>
					{simpleLeafs.length > 0 && (
						<>
							<ParserTable rows={simpleLeafs} />
							<br />
						</>
					)}
				</>
			)}
		</>
	);
};

export default ParserTablePanel;

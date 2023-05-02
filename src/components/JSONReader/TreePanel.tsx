import React from 'react';
import { createBemBlock } from '../../helpers/styleCreators';
import { Tree, ViewInstruction } from '../../models/JSONSchema';
import { isSimpleLeaf } from '../../helpers/JSONViewer';
import '../../styles/JSONviewer.scss';

const TreePanel = ({
	node,
	setNode,
	parentsPath,
	parentKey,
	selectedNode,
}: {
	node: Tree;
	setNode: (nodeKey: string, selectNode: Tree) => void;
	parentsPath: string;
	parentKey: string;
	selectedNode: [string, Tree];
}) => {
	const nest = parentsPath.match(/\/\/\//gm)?.length || 0;
	const [open, setOpen] = React.useState(!parentKey);
	const failed = parentKey
		? parentKey.includes('[fail]') || parentKey.trim().indexOf('#') === 0
		: undefined;
	const display = node.view_instruction;
	const leafs = Object.entries(node);
	const simpleLeafs: [string, string | string[]][] = [];
	const complexLeafs: [string, Tree][] = [];
	leafs.forEach(([key, value]) => {
		if (!value) return;
		if (key === 'view_instruction') return;
		if (isSimpleLeaf(value)) {
			simpleLeafs.push([key, value]);
			return;
		}
		if (display === ViewInstruction.summaryAndTree) simpleLeafs.push([key, '']);
		complexLeafs.push([key, value]);
	});
	if (display === ViewInstruction.table)
		return (
			<div className='lowerLevel'>
				{parentKey && (
					<div className='leafWrapper'>
						<div style={{ width: `${20 * nest}px` }} />
						<div className={createBemBlock('expand-icon', 'none')} />
						<div
							className={createBemBlock(
								'valueLeaf',
								failed ? 'failed' : 'passed',
								JSON.stringify([parentKey, node]) === JSON.stringify(selectedNode)
									? 'selected'
									: null,
							)}
							onClick={() => setNode(parentKey, node)}
							title={parentKey}>
							<div className={createBemBlock('event-status-icon', failed ? 'failed' : 'passed')} />
							{parentKey}
						</div>
					</div>
				)}
			</div>
		);
	return (
		<>
			{parentKey && (
				<div className='leafWrapper'>
					<div style={{ width: `${20 * nest}px` }} />
					<div
						className={createBemBlock(
							'expand-icon',
							open ? 'expanded' : 'hidden',
							complexLeafs.length > 0 ? null : 'none',
						)}
						onClick={() => setOpen(!open)}
					/>
					<div
						className={createBemBlock(
							'valueLeaf',
							failed ? 'failed' : 'passed',
							JSON.stringify([parentKey, node]) === JSON.stringify(selectedNode)
								? 'selected'
								: null,
						)}
						onClick={() => setNode(parentKey, node)}
						title={parentKey}>
						<div className={createBemBlock('event-status-icon', failed ? 'failed' : 'passed')} />
						{parentKey}
					</div>
				</div>
			)}
			{open &&
				complexLeafs.length > 0 &&
				complexLeafs.map(([parent, childNode]) => (
					<React.Fragment key={`${parentsPath}///${parent}`}>
						<TreePanel
							node={childNode}
							setNode={setNode}
							parentsPath={`${parentsPath}///${parent}`}
							parentKey={parent}
							selectedNode={selectedNode}
						/>
					</React.Fragment>
				))}
		</>
	);
};

export default TreePanel;

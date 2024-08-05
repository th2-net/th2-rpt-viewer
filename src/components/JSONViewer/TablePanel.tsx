import React from 'react';
import { createBemBlock } from '../../helpers/styleCreators';
import Table from './Table';
import '../../styles/JSONviewer.scss';
import { TreeNode } from '../../models/JSONSchema';
import SplitView from '../split-view/SplitView';
import SplitViewPane from '../split-view/SplitViewPane';

interface props {
	panelArea: number;
	selectedNode: TreeNode;
	compareNode: TreeNode;
	setPanelArea: (p: number) => void;
}

const TablePanel = ({ selectedNode, compareNode, panelArea, setPanelArea }: props) => {
	const [scrollTop, setScrollTop] = React.useState(0);

	const getName = (treeNode: TreeNode) => {
		if (treeNode.displayName) return treeNode.displayName;
		if (treeNode.key && !(treeNode.isGeneratedKey && !treeNode.isRoot)) return treeNode.key;
		return 'no display name';
	};

	const onScroll = (e: React.UIEvent<'div'>) => {
		const scroller = e.target;
		if (scroller instanceof Element) {
			setScrollTop(scroller.scrollTop);
		}
	};

	const getPanel = (treeNode: TreeNode, type: 'select' | 'compare') => (
		<>
			{treeNode.id !== '' && (
				<>
					{treeNode.id !== '' && getName(treeNode) !== '' && (
						<div
							className={createBemBlock('valueLeaf', 'header', 'selected')}
							style={{ cursor: 'default' }}
							title={getName(treeNode)}>
							<div
								className={createBemBlock(
									'event-status-icon',
									treeNode.failed ? 'failed' : 'passed',
								)}
							/>
							<div className={'title'} title={treeNode.key}>
								{getName(treeNode)}
							</div>
						</div>
					)}
					<Table scrollTop={scrollTop} type={type} onScroll={onScroll} />
					<br />
				</>
			)}
		</>
	);

	const selectedPanel = React.useMemo(
		() => getPanel(selectedNode, 'select'),
		[selectedNode, scrollTop],
	);

	const comparePanel = React.useMemo(
		() => getPanel(compareNode, 'compare'),
		[compareNode, scrollTop],
	);

	return (
		<SplitView panelArea={panelArea} onPanelAreaChange={setPanelArea}>
			<SplitViewPane>{selectedPanel}</SplitViewPane>
			<SplitViewPane>{comparePanel}</SplitViewPane>
		</SplitView>
	);
};

export default TablePanel;

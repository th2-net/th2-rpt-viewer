import React, { useMemo } from 'react';
import { createBemBlock } from '../../helpers/styleCreators';
import Table from './Table';
import '../../styles/JSONviewer.scss';
import { TreeNode } from '../../models/JSONSchema';

const TablePanel = ({ node }: { node: TreeNode }) => {
	const { key, simpleFields, complexFields } = node;
	const nodeName = useMemo(() => {
		if (node.displayName) return node.displayName;
		if (node.key && !(node.isGeneratedKey && !node.isRoot)) return node.key;
		return 'no display name';
	}, [node.displayName, node.key, node.isGeneratedKey]);

	return (
		<>
			{nodeName !== '' && (
				<div
					className={createBemBlock('valueLeaf', 'header', 'selected')}
					style={{ cursor: 'default' }}
					title={nodeName}>
					<div className={createBemBlock('event-status-icon', node.failed ? 'failed' : 'passed')} />
					<div className={'title'} title={key}>
						{nodeName}
					</div>
				</div>
			)}
			<>
				<Table simpleFields={simpleFields} complexFields={complexFields} />
				<br />
			</>
		</>
	);
};

export default TablePanel;

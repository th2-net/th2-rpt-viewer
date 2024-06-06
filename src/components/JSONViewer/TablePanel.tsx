import React from 'react';
import { createBemBlock } from '../../helpers/styleCreators';
import Table from './Table';
import '../../styles/JSONviewer.scss';
import { TreeNode } from '../../models/JSONSchema';

const TablePanel = ({ node }: { node: TreeNode }) => {
	const { key, simpleFields, complexFields } = node;

	return (
		<>
			{key !== '' && (
				<div
					className={createBemBlock('valueLeaf', 'header', 'selected')}
					style={{ cursor: 'default' }}
					title={key}>
					<div className={createBemBlock('event-status-icon', node.failed ? 'failed' : 'passed')} />
					<div className={'title'} title={key}>
						{key}
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

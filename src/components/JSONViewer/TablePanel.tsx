import React from 'react';
import { createBemBlock } from '../../helpers/styleCreators';
import Table from './Table';
import '../../styles/JSONviewer.scss';
import { TreeNode, ViewInstruction } from '../../models/JSONSchema';

const TablePanel = ({ node }: { node: TreeNode }) => {
	const { key, viewInstruction, simpleFields, complexFields } = node;

	return (
		<>
			{key !== '' && (
				<div
					className={createBemBlock('valueLeaf', node.failed ? 'failed' : 'passed', 'selected')}
					style={{ cursor: 'default' }}
					title={key}>
					<div className={createBemBlock('event-status-icon', node.failed ? 'failed' : 'passed')} />
					{key}
				</div>
			)}
			{viewInstruction === ViewInstruction.table ? (
				<>
					<Table simpleFields={simpleFields} complexFields={complexFields} />
					<br />
				</>
			) : (
				simpleFields.length > 0 && (
					<>
						<Table simpleFields={simpleFields} complexFields={[]} />
						<br />
					</>
				)
			)}
		</>
	);
};

export default TablePanel;

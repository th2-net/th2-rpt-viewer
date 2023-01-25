import React from 'react';
import { Tree } from '../../models/Parser';
import SplitView from '../split-view/SplitView';
import SplitViewPane from '../split-view/SplitViewPane';
import ParserTablePanel from './ParserTablePanel';
import ParserTreePanel from './ParserTreePanel';
import '../../styles/parser.scss';

const Parser = ({ jsonFile = {} }: { jsonFile?: Tree }) => {
	const [data, setData] = React.useState<Tree>({});
	const [view, setView] = React.useState(50);
	const [node, setNode] = React.useState<[string, Tree]>(['', jsonFile]);
	const readFile = async (file: File) => {
		setData(JSON.parse(await file.text()));
	};
	return (
		<div className='parser'>
			<input
				style={{ marginBottom: 10 }}
				type='file'
				accept='.json'
				onChange={ev => {
					if (ev.target.files) {
						readFile(ev.target.files[0]);
						setNode(['', {}]);
					}
				}}
			/>
			<div style={{ height: 'calc(100% - 31px)' }}>
				<SplitView panelArea={view} onPanelAreaChange={setView}>
					<SplitViewPane>
						<div className='parser-tree-panel'>
							<ParserTreePanel
								node={data}
								setNode={(nodeKey: string, nodeTree: Tree) => setNode([nodeKey, nodeTree])}
								parentsPath={''}
								parentKey={''}
								selectedNode={node}
							/>
						</div>
					</SplitViewPane>
					<SplitViewPane>
						<div className='parser-table-panel'>
							<ParserTablePanel node={node} />
						</div>
					</SplitViewPane>
				</SplitView>
			</div>
		</div>
	);
};
export default Parser;

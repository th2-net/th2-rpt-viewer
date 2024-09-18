import React from 'react';
import { observer } from 'mobx-react-lite';
import '../../styles/JSONviewer.scss';
import SplitView from '../split-view/SplitView';
import SplitViewPane from '../split-view/SplitViewPane';
import TreeList from './TreeList';
import TablePanel from './TablePanel';

interface props {
	type: 'left' | 'right';
}

const JSONPanel = ({ type }: props) => {
	const [panelArea, setPanelArea] = React.useState(100);

	return (
		<SplitView panelArea={panelArea} onPanelAreaChange={setPanelArea} maxWidth={window.innerWidth}>
			<SplitViewPane>
				<TreeList type={type} />
			</SplitViewPane>
			<SplitViewPane>
				<TablePanel type={type} />
			</SplitViewPane>
		</SplitView>
	);
};

export default observer(JSONPanel);

/** ****************************************************************************
 * Copyright 2024-2025 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { observer } from 'mobx-react-lite';
import '../../styles/JSONviewer.scss';
import SplitView from '../split-view/SplitView';
import SplitViewPane from '../split-view/SplitViewPane';
import TreeList from './TreeList';
import TablePanel from './TablePanel';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';

interface props {
	type: PanelType;
}

const JSONView = ({ type }: props) => {
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

export default observer(JSONView);

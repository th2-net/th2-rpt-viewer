/** ****************************************************************************
 * Copyright 2009-2019 Exactpro (Exactpro Systems Limited)
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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import Panel from '../util/Panel';
import { ToggleButton } from './ToggleButton';
import { ActionsList } from './action/ActionsList';
import { StatusPanel } from './StatusPanel';
import { createStyleSelector } from '../helpers/styleCreators';
import ActionPanelControl from './action/ActionPanelControls';
import { useStores } from '../hooks/useStores';
import '../styles/layout.scss';

export const LeftPanel = observer(() => {
	const { viewStore, selectedStore } = useStores();

	const getCurrentPanelControls = () => {
		switch (viewStore.leftPanel) {
		case Panel.ACTIONS: {
			return <ActionPanelControl/>;
		}

		default: {
			return null;
		}
		}
	};

	const selectPanel = (panel: Panel.ACTIONS | Panel.STATUS) => {
		viewStore.setLeftPane(panel);
	};

	const statusEnabled = selectedStore.testCase!.status.cause != null;
	const actionsEnabled = selectedStore.testCase!.files.action!.count > 0;

	const actionRootClass = createStyleSelector(
		'layout-panel__content-wrapper',
		viewStore.leftPanel === Panel.ACTIONS && actionsEnabled ? null : 'disabled',
	);
	const statusRootClass = createStyleSelector(
		'layout-panel__content-wrapper',
		viewStore.leftPanel === Panel.STATUS && statusEnabled ? null : 'disabled',
	);

	return (
		<div className="layout-panel">
			<div className="layout-panel__controls">
				<div className="layout-panel__tabs">
					<ToggleButton
						isToggled={viewStore.leftPanel === Panel.ACTIONS}
						isDisabled={!actionsEnabled}
						onClick={() => actionsEnabled && selectPanel(Panel.ACTIONS)}>
						Actions
					</ToggleButton>
					<ToggleButton
						isToggled={viewStore.leftPanel === Panel.STATUS}
						isDisabled={!statusEnabled}
						onClick={() => statusEnabled && selectPanel(Panel.STATUS)}>
						Status
					</ToggleButton>
				</div>
				{getCurrentPanelControls()}
			</div>
			<div className="layout-panel__content">
				<div className={actionRootClass}>
					<ActionsList />
				</div>
				<div className={statusRootClass}>
					<StatusPanel/>
				</div>
			</div>
		</div>
	);
});

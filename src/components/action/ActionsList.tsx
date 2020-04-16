/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

/* eslint-disable no-new-wrappers */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../hooks/useStores';
import { ActionNode, isAction } from '../../models/Action';
import { VirtualizedList } from '../VirtualizedList';
import StateSaverProvider from '../util/StateSaverProvider';
import { actionsHeatmap } from '../../helpers/heatmapCreator';
import { createBemElement } from '../../helpers/styleCreators';
import { getActions } from '../../helpers/action';
import SkeletonedActionTree from './SkeletonedActionTree';
import '../../styles/action.scss';

export const ActionsList = observer(() => {
	// eslint-disable-next-line @typescript-eslint/ban-types
	const getScrolledIndex = (scrolledActionId: Number | null, actions: ActionNode[]): Number | null => {
		const scrolledIndex = actions.findIndex(
			action => isAction(action) && action.id === Number(scrolledActionId),
		);

		return scrolledIndex !== -1 ? new Number(scrolledIndex) : null;
	};

	const { selectedStore, filterStore } = useStores();
	const list = React.useRef<VirtualizedList>();
	/*
		Number objects is used here because in some cases (eg one message / action was selected several times
		by diferent entities)
    	We can't understand that we need to scroll to the selected entity again when we are comparing primitive numbers.
    	Objects and reference comparison is the only way to handle numbers changing in this case.
	*/
	// eslint-disable-next-line @typescript-eslint/ban-types
	const [scrolledIndex, setScrolledIndex] = React.useState<Number | null>(
		getScrolledIndex(selectedStore.scrolledActionId, selectedStore.actions),
	);

	React.useEffect(() => {
		if (selectedStore.scrolledActionId != null) {
			setScrolledIndex(getScrolledIndex(selectedStore.scrolledActionId, selectedStore.actions));
		}
	}, [selectedStore.scrolledActionId]);

	const scrollToTop = () => {
		// eslint-disable-next-line no-new-wrappers
		setScrolledIndex(new Number(0));
	};

	const computeKey = (index: number): number => {
		const action = selectedStore.actions[index];

		return action && isAction(action) ? action.id : index;
	};

	const renderAction = (index: number): React.ReactElement => <SkeletonedActionTree index={index} />;


	const listRootClass = createBemElement(
		'actions',
		'list',
		filterStore.isFilterApplied ? 'filter-applied' : null,
	);

	return (
		<div className="actions">
			<div className={listRootClass}>
				<StateSaverProvider>
					<VirtualizedList
						rowCount={selectedStore.actions.length}
						ref={list as any}
						renderElement={renderAction}
						computeItemKey={computeKey}
						scrolledIndex={scrolledIndex}
						selectedElements={actionsHeatmap(getActions(selectedStore.actions), selectedStore.actionsId)}
						scrollHints={[]}
					/>
				</StateSaverProvider>
			</div>
		</div>
	);
}, {
	forwardRef: true,
});

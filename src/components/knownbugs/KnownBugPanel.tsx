/** *****************************************************************************
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
import { useStores } from '../../hooks/useStores';
import { KnownBugCard } from './KnownBugCard';
import { intersection } from '../../helpers/array';
import { getCategoryBugChains } from '../../helpers/knownbug';
import '../../styles/statusPanel.scss';

const NO_CATEGORY_TITLE = 'No Categories';
const RIGHT_ARROW = '\u25B6';

export const KnownBugPanel = observer((): React.ReactElement => {
	const { selectedStore } = useStores();

	const categoryChains = getCategoryBugChains(selectedStore.bugs);

	const arrow = <span className="known-bug-list__arrow">{RIGHT_ARROW}</span>;

	return (
		<div className="known-bug-list">
			{
				categoryChains.map(({ categoriesChain, categoryBugs }, index) => (
					<React.Fragment key={index}>
						<div className="known-bug-list__category-title">
							{
								categoriesChain.length === 0
									? NO_CATEGORY_TITLE
									: categoriesChain.map((categoryName, i) => (
										<React.Fragment key={i}>
											{categoryName} {i + 1 !== categoriesChain.length ? arrow : null}
										</React.Fragment>
									))
							}
						</div>
						{
							categoryBugs.map(bug => (
								<KnownBugCard
									key={bug.id}
									bug={bug}
									actionsMap={selectedStore.actionsMap}
									selectedStatus={selectedStore.selectedActionStatus}
									isSelected={intersection(selectedStore.actionsId, bug.relatedActionIds).length > 0}
									onSelect={(status = undefined) => selectedStore.selectKnownBug(bug, status)} />
							))
						}
					</React.Fragment>
				))
			}
		</div>
	);
});

/** *****************************************************************************
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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../hooks/useStores';
import RejectedMessagesCarousel from '../RejectedMessagesCarousel';
import { createTriStateControlClassName } from '../../helpers/styleCreators';

interface Props {
    showTitles: boolean;
}

const MessagePanelControl = observer(({ showTitles }: Props) => {
	const { mlStore, selectedStore, viewStore } = useStores();

	const { predictionsEnabled } = mlStore;
	const adminMessagesEnabled = viewStore.adminMessagesEnabled.valueOf();
	const adminControlEnabled = selectedStore.adminMessages.length > 0;
	const rejectedControlEnabled = selectedStore.rejectedMessages.length > 0;
	const predictionsAvailable = mlStore.isPredictionsAvailable;

	const onPredictionClick = () => {
		if (predictionsAvailable) {
			mlStore.togglePredictions();
		}
	};

	const adminRootClass = createTriStateControlClassName(
		'layout-control',
		adminMessagesEnabled,
		adminControlEnabled,
	);
	const adminIconClass = createTriStateControlClassName(
		'layout-control__icon admin',
		adminMessagesEnabled,
		adminControlEnabled,
	);
	const adminTitleClass = createTriStateControlClassName(
		'layout-control__title selectable',
		adminMessagesEnabled,
		adminControlEnabled,
	);
	const rejectedRootClass = createTriStateControlClassName(
		'layout-control',
		true,
		rejectedControlEnabled,
	);
	const rejectedIconClass = createTriStateControlClassName(
		'layout-control__icon rejected',
		true,
		rejectedControlEnabled,
	);
	const rejectedTitleClass = createTriStateControlClassName(
		'layout-control__title',
		true,
		rejectedControlEnabled,
	);
	const predictionRootClass = createTriStateControlClassName(
		'layout-control',
		predictionsEnabled,
		predictionsAvailable,
	);
	const predictionIconClass = createTriStateControlClassName(
		'layout-control__icon prediction',
		predictionsEnabled,
		predictionsAvailable,
	);
	const predictionTitleClass = createTriStateControlClassName(
		'layout-control__title prediction selectable',
		predictionsEnabled,
		predictionsAvailable,
	);

	return (
		<React.Fragment>
			{
				viewStore.beautifiedMessages.length > 0 ? (
					<div className="layout-control"
						title="Back to plain text"
						onClick={viewStore.uglifyAllMessages}>
						<div className="layout-control__icon beautifier"/>
					</div>
				) : null
			}
			<div className={adminRootClass}
				onClick={() => adminControlEnabled && viewStore.setAdminMsgEnabled(!adminMessagesEnabled)}
				title={`${adminMessagesEnabled ? 'Hide' : 'Show'} Admin messages`}>
				<div className={adminIconClass}/>
				{
					showTitles
						? <div className={adminTitleClass}>
							<p>{adminControlEnabled ? '' : 'No'} Admin Messages</p>
						</div>
						: null
				}
			</div>
			<div className={rejectedRootClass}>
				<div className={rejectedIconClass}
					onClick={() => {
						if (rejectedControlEnabled && selectedStore.rejectedMessageId) {
							selectedStore.selectRejectedMessage(selectedStore.rejectedMessageId);
						}
					}}
					style={{ cursor: rejectedControlEnabled ? 'pointer' : 'unset' }}
					title={rejectedControlEnabled ? 'Scroll to current rejected message' : undefined}/>
				{
					showTitles
						? <div className={rejectedTitleClass}>
							<p>{rejectedControlEnabled ? '' : 'No '}Rejected</p>
						</div>
						: null
				}
				{
					rejectedControlEnabled
						? <RejectedMessagesCarousel/>
						: null
				}
			</div>
			<div className={predictionRootClass}
				title={predictionsEnabled ? 'Hide predictions' : 'Show predictions'}
				onClick={onPredictionClick}>
				<div className={predictionIconClass}/>
				<div className={predictionTitleClass}>
					{
						showTitles
							? <p>{predictionsAvailable ? 'Predictions' : 'No predictions'}</p>
							: null
					}
				</div>
			</div>
		</React.Fragment>
	);
});

export default MessagePanelControl;

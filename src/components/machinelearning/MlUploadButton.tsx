/*
 * ****************************************************************************
 *  Copyright 2009-2019 Exactpro (Exactpro Systems Limited)
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * ****************************************************************************
 */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../hooks/useStores';
import { StatusType } from '../../models/Status';
import '../../styles/messages.scss';

interface Props {
    messageId: number;
    show?: boolean;
}

export const MlUploadButton = observer(({ messageId, show }: Props) => {
	const { selectedStore, mlStore } = useStores();
	const activeAction = selectedStore.actionsMap.get(selectedStore.activeActionId as number);

	const isAvailable = mlStore.token !== null
        && (show == null || show)
        && activeAction != null
        && activeAction.status.status === StatusType.FAILED;

	const isSubmitted = isAvailable && mlStore.submittedData.some(entry => entry.messageId === messageId
            && entry.actionId === selectedStore.activeActionId);

	// default one (message cannot be submitted or ml servie is unavailable)
	let mlButton = <div className="ml__submit-icon inactive" />;

	if (isAvailable) {
		mlButton = isSubmitted

			? <div className="ml__submit-icon submitted"
				title="Revoke ML data" />

			: <div className="ml__submit-icon active"
				title="Submit ML data" />;
	}

	return (
		<div className="ml__submit" title="Unable to submit ML data">
			{mlButton}
		</div>
	);
});

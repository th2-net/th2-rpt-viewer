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
import { useStores } from '../hooks/useStores';
import { StatusType } from '../models/Status';
import '../styles/messages.scss';

interface Props {
    actionId: number;
}

export const EMPTY_MESSAGE_ID = -1;

export const ActionMlUploadButtonBase = observer(({ actionId }: Props) => {
	const { mlStore, selectedStore } = useStores();
	const isAvailable = mlStore.token !== null
        && selectedStore.actionsMap.get(actionId)?.status.status === StatusType.FAILED;

	const submittedWithThisAction = mlStore.submittedData.filter(entry => entry.actionId === actionId);

	const submittedMessagesCount = submittedWithThisAction.filter(entry => entry.messageId !== EMPTY_MESSAGE_ID).length;

	const isSubmitted = submittedWithThisAction.length > 0;

	if (isAvailable) {
		const mlButton = isSubmitted
			? <div className="ml-action__submit-icon submitted"
				title="Revoke all ML data related to this action"/>
			: <div className="ml-action__submit-icon active"
				title="Submit ML data without cause message" />;

		return (
			<div className="ml-action__submit" title="Unable to submit ML data">
				{mlButton}
				<div className={`ml-action__submit-counter ${isSubmitted ? 'submitted' : 'active'}`}>
					{submittedMessagesCount}
				</div>
			</div>
		);
	}

	return null;
});

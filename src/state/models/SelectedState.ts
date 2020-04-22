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

import { StatusType } from '../../models/Status';
import TestCase from '../../models/TestCase';
import Action from '../../models/Action';

export default interface SelectedState {
    selectedTestCaseId: string | null;
    testCase: TestCase | null;
    actionsId: number[];
    messagesId: number[];
    verificationId: number | null;
    checkpointMessageId: number | null;
    checkpointActionId: number | null;
    rejectedMessageId: number | null;
    selectedActionStatus: StatusType;
    /**
     * Map (id -> action)
     */
    actionsMap: Map<number, Action>;

    /*
        Number objects is used here because in some cases (eg one message / action was selected several
        times by different entities) We can't understand that we need to scroll to the selected entity again
        when we are comparing primitive numbers.
        Objects and reference comparison is the only way to handle numbers changing in this case.
    */
    scrolledActionId: number | null;
    scrolledMessageId: number | null;
    scrolledLogIndex: number | null;
    activeActionId: number | null;
    actionsScrollHintsIds: number[];
    messagesScrollHintsIds: number[];
}

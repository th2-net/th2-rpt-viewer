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

import Exception from './Exception';

export enum StatusType {
    PASSED = 'PASSED',
    FAILED = 'FAILED',
    CONDITIONALLY_PASSED = 'CONDITIONALLY_PASSED',
    NA = 'NA',
    SKIPPED = 'SKIPPED',
    CONDITIONALLY_FAILED = 'CONDITIONALLY_FAILED'
}

export const statusValues: StatusType[] = Object.values(StatusType);

export default interface Status {
    status: StatusType;
    reason: string | null;
    details: string | null;
    description: string | null;
    cause: Exception | null;
}

export enum EventStatus {
    PASSED = 'PASSED',
    FAILED = 'FAILED',
}

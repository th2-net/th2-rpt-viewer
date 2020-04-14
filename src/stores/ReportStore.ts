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

import { action, observable } from 'mobx';
import Report from '../models/Report';
import ViewStore from './ViewStore';
import ApiSchema from "../api/ApiSchema";
import { createReport } from "../__tests__/util/creators";

export default class ReportStore {

    private api: ApiSchema;

    private viewStore: ViewStore;

    constructor(api: ApiSchema, viewStore: ViewStore) {
        this.api = api;
        this.viewStore = viewStore;
    }

    @observable report: Report | null = null;

    @action
    loadReport = async () => {
        this.report = createReport('');
        this.viewStore.isLoading = false;
    };
}

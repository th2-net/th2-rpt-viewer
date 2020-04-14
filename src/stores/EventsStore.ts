/*******************************************************************************
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
 ******************************************************************************/
import ApiSchema from "../api/ApiSchema";
import { action, computed, observable } from "mobx";
import EventAction from "../models/EventAction";

export default class EventStore {

    private api: ApiSchema;

    @observable
    private eventsIds: number[] = [];

    @observable
    private eventsList: EventAction[] = [];

    constructor(api: ApiSchema) {
        this.api = api;
    }

    @action
    async init() {
        this.eventsIds = await this.api.events.getAll();

        const fullList = new Array<EventAction>();

        for (let id of this.eventsIds) {
            fullList.push((await this.api.events.getEvent(id))!);
        }

        this.eventsList = fullList;
    }

    @computed
    get fullList() {
        return this.eventsList;
    }
}

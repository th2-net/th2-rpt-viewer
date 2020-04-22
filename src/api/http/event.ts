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
import { EventApiSchema } from "../ApiSchema";

const eventHttpApi: EventApiSchema = {
    getAll: async () => {
        const res = await fetch('/search/events');

        if (res.ok) {
            return await res.json();
        }

        console.error(res.statusText);
        return [];
    },
    getSubNodes: async (id) => {
        const res = await fetch(`/event/${id}/children`);

        if (res.ok) {
            return await res.json();
        }

        console.error(res.statusText);
        return [];
    },
    getEvent: async (id) => {
        const res = await fetch(`/event/${id}`);

        if (res.ok) {
            return await res.json();
        }

        console.error(res.statusText);
        return null;
    }
};

export default eventHttpApi;

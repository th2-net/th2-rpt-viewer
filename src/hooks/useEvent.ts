/** *****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

import { useState, useEffect, useMemo } from 'react';
import api from 'api/event';
import { isAbortError } from 'helpers/fetch';
import { useDebouncedCallback } from 'hooks/useDebouncedCallback';
import { EventAction } from 'models/EventAction';

export const useEvent = (eventId: string, debounceMs = 400) => {
	const [event, setEvent] = useState<EventAction | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);

	const fetchEvent = useDebouncedCallback(async (id: string, signal: AbortSignal) => {
		setIsError(false);
		if (!id) {
			setEvent(null);
			return;
		}

		setIsLoading(true);
		try {
			const foundEvent = await api.getEvent(id, signal, { probe: true });
			setEvent(foundEvent);
		} catch (error) {
			if (!isAbortError(error)) {
				setIsError(true);
			}
		} finally {
			setIsLoading(false);
		}
	}, debounceMs);

	useEffect(() => {
		const ac = new AbortController();
		if (!eventId) {
			setEvent(null);
			setIsError(false);
			setIsLoading(false);
		} else {
			fetchEvent(eventId, ac.signal);
		}
		return () => ac.abort();
	}, [eventId]);

	return useMemo(
		() => ({
			event,
			isLoading,
			isError,
		}),
		[event, isLoading, isError],
	);
};

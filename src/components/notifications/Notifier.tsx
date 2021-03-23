/** ****************************************************************************
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

import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useToasts } from 'react-toast-notifications';
import { complement } from 'helpers/array';
import { useNotificationsStore, usePrevious } from 'hooks';
import FetchError from './FetchError';
import UrlError from './UrlError';

function Notifier() {
	const { addToast } = useToasts();

	const { responseErrors, delResponseError, urlError, setUrlError } = useNotificationsStore();

	const prevResponseErrors = usePrevious(responseErrors);

	useEffect(() => {
		const currentResponseErrors = !prevResponseErrors
			? responseErrors
			: complement(responseErrors, prevResponseErrors);
		currentResponseErrors.forEach(n => {
			const { type, ...props } = n;
			addToast(<FetchError {...props} />, {
				appearance: type,
				onDismiss: () => delResponseError(n),
			});
		});
	}, [responseErrors]);

	useEffect(() => {
		if (urlError) {
			const { type, link, error } = urlError;
			addToast(<UrlError link={link} error={error} />, {
				appearance: type,
				onDismiss: () => setUrlError(null),
			});
		}
	}, [urlError]);

	return null;
}

export default observer(Notifier);

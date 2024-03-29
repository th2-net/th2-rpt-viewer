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

import React from 'react';
import EmbeddedEvent from './EmbeddedEvent';
import EmbeddedMessage from './EmbeddedMessage';
import '../../styles/embedded.scss';

function EmbeddedApp() {
	if (window.location.search.split('&').length > 2) {
		throw new Error('Only one query parameter expected.');
	}
	const searchParams = new URLSearchParams(window.location.search);
	const eventId = searchParams.get('eventId');
	const messageId = searchParams.get('messageId');

	if (eventId) {
		return <EmbeddedEvent eventId={eventId} />;
	}
	if (messageId) {
		return <EmbeddedMessage messageId={messageId} />;
	}
	throw new Error('Provide messageId or eventId');
}

export default EmbeddedApp;

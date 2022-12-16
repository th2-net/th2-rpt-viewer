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

import EmbeddedMessage from 'modules/messages/embedded/EmbeddedMessage';
import EmbeddedMessages from 'modules/messages/embedded/EmbeddedMessages';
import EmbeddedEvent from 'modules/events/embedded/EmbeddedEvent';
import useViewMode from 'hooks/useViewMode';
import { ViewMode } from 'components/ViewModeProvider';
import 'styles/embedded.scss';

function EmbeddedApp() {
	const searchParams = new URLSearchParams(window.location.search);
	const viewMode = useViewMode();

	if (viewMode === ViewMode.EmbeddedMessages) {
		return <EmbeddedMessages />;
	}

	const eventId = searchParams.get('eventId');
	const messageId = searchParams.get('messageId');

	if (!eventId && !messageId) {
		throw new Error("'messageId' or 'eventId' query parameter expected");
	}

	return (
		<div className='embedded-wrapper'>
			{eventId ? (
				<EmbeddedEvent eventId={eventId} />
			) : messageId ? (
				<EmbeddedMessage messageId={messageId} />
			) : null}
		</div>
	);
}

export default EmbeddedApp;
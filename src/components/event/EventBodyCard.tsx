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

import * as React from 'react';
import { EventAction } from '../../models/EventAction';
import { CustomTable } from './tables/CustomTable';
import { VerificationTable } from './tables/VerificationTable';
import { keyForVerification } from '../../helpers/keys';
import ParamsTable from './tables/ParamsTable';
import { extractParams } from '../../helpers/tables';
import { EventBodyPayload, EventBodyPayloadType } from '../../models/EventActionPayload';
import ErrorBoundary from '../util/ErrorBoundary';
import { getEventStatus } from '../../helpers/event';
import api from '../../api';
import { ReferenceCard } from './ReferenceCard';

interface Props {
	body: EventBodyPayload;
	parentEvent: EventAction;
	referenceHistory?: Array<string>;
}

export function EventBodyPayloadRenderer({ body, parentEvent, referenceHistory = [] }: Props) {
	const ac = new AbortController();
	const [referencedEvent, setReferencedEvent] = React.useState<EventAction | null>(null);
	const [referencedBody, setReferencedBody] = React.useState<EventBodyPayload[]>([]);

	React.useEffect(() => {
		if (body.type === EventBodyPayloadType.REFERENCE) {
			api.events
				.getEvent(body.eventId, ac.signal, { probe: true })
				.then(ev => {
					setReferencedEvent(ev);
					setReferencedBody(ev.body);
				})
				.catch(() => setReferencedEvent(null));
		}
	}, [body]);

	switch (body.type) {
		case EventBodyPayloadType.MESSAGE:
			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
					<div style={{ overflowX: 'auto' }}>
						<div key='message' className='event-detail-info__message'>
							{body.data}
						</div>
					</div>
				</ErrorBoundary>
			);
		case EventBodyPayloadType.TABLE:
			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
					<CustomTable content={body.rows} key='table' />
				</ErrorBoundary>
			);
		case EventBodyPayloadType.VERIFICATION:
			// eslint-disable-next-line no-case-declarations
			const key = keyForVerification(parentEvent.parentEventId, parentEvent.eventId);

			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
					<div>
						<VerificationTable
							payload={body}
							status={getEventStatus(parentEvent)}
							keyPrefix={key}
							stateKey={`${key}-nodes`}
						/>
					</div>
				</ErrorBoundary>
			);
		case EventBodyPayloadType.TREE_TABLE:
			// eslint-disable-next-line no-case-declarations
			const { columns, rows } = extractParams(body);
			return (
				<ErrorBoundary>
					<div>
						{body.name && <div className='ac-body__item-title'>{body.name}</div>}
						<ParamsTable
							expandPath={[]}
							columns={columns}
							rows={rows}
							stateKey={`${parentEvent.eventId}-input-params-nodes`}
							name={parentEvent.eventName}
						/>
					</div>
				</ErrorBoundary>
			);
		case EventBodyPayloadType.REFERENCE:
			return (
				<ErrorBoundary>
					<ReferenceCard
						eventId={body.eventId}
						body={referencedBody}
						parentEvent={referencedEvent}
						referenceHistory={referenceHistory}
					/>
				</ErrorBoundary>
			);
		default:
			return <JSONBodyFallback body={body} />;
	}
}

export default function EventBodyCard({ parentEvent, body, referenceHistory }: Props) {
	return (
		<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
			<EventBodyPayloadRenderer
				body={body}
				parentEvent={parentEvent}
				referenceHistory={referenceHistory}
			/>
		</ErrorBoundary>
	);
}

function JSONBodyFallback({ body }: { body: unknown }) {
	if (!body) return null;

	const content =
		typeof body === 'object' && body !== null && Object.keys(body).length > 0 ? body : null;

	if (!content) {
		return null;
	}

	return (
		<div className='event-body-fallback'>
			<pre>{JSON.stringify(content, null, 4)}</pre>
		</div>
	);
}

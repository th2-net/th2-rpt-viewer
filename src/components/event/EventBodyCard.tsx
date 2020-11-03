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
import { CustomTable } from './CustomTable';
import { VerificationTable } from './VerificationTable';
import { keyForVerification } from '../../helpers/keys';
import ParamsTable from './ParamsTable';
import { extractParams } from '../../helpers/tables';
import { EventBodyPayload, EventBodyPayloadType } from '../../models/EventActionPayload';
import ErrorBoundary from '../util/ErrorBoundary';

interface Props {
	body: EventBodyPayload;
	parentEvent: EventAction;
}

export function EventBodyPayloadRenderer({ body, parentEvent }: Props) {
	switch (body.type) {
		case EventBodyPayloadType.MESSAGE:
			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body}/>}>
					<div style={{ overflowX: 'auto' }}>
						<div key="message" className="event-detail-card__message">
							{body.data}
						</div>
					</div>
				</ErrorBoundary>

			);
		case EventBodyPayloadType.TABLE:
			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body}/>}>
					<CustomTable
						content={body.rows}
						key="table"/>
				</ErrorBoundary>
			);
		case EventBodyPayloadType.VERIFICATION:
			// eslint-disable-next-line no-case-declarations
			const key = keyForVerification(parentEvent.parentEventId, parentEvent.eventId);

			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body}/>}>
					<div>
						<VerificationTable
							actionId={parentEvent.eventId as any}
							messageId={parentEvent.attachedMessageIds[0] as any}
							payload={body}
							status={(parentEvent.successful ? 'PASSED' : 'FAILED') as any}
							keyPrefix={key}
							stateKey={`${key}-nodes`}/>
					</div>
				</ErrorBoundary>
			);
		case EventBodyPayloadType.TREE_TABLE:
			// eslint-disable-next-line no-case-declarations
			const { columns, rows } = extractParams(body);
			return 	(
				<ErrorBoundary>
					<div>
						<ParamsTable
							columns={columns}
							rows={rows}
							actionId={parentEvent.eventId as any}
							stateKey={`${parentEvent.eventId}-input-params-nodes`}
							name={parentEvent.eventName}/>
					</div>
				</ErrorBoundary>
			);
		default:
			return <JSONBodyFallback body={body}/>;
	}
}

export default function EventBodyCard({ parentEvent, body }: Props) {
	return (
		<ErrorBoundary
			fallback={<JSONBodyFallback body={body}/>}>
			<EventBodyPayloadRenderer body={body} parentEvent={parentEvent}/>
		</ErrorBoundary>
	);
}

function JSONBodyFallback({ body }: { body: unknown }) {
	if (!body) return null;

	const content = typeof body === 'object' && body !== null && Object.keys(body).length > 0
		? body
		: null;

	if (!content) {
		return null;
	}

	return (
		<div className="event-body-fallback">
			<pre>
				{JSON.stringify(content, null, 4)}
			</pre>
		</div>
	);
}

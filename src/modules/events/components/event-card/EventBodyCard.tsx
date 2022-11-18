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

import { EventAction } from 'models/EventAction';
import ErrorBoundary from 'components/util/ErrorBoundary';
import {
	EventBodyPayload,
	EventBodyPayloadType,
	EventActionBody,
} from '../../models/EventBodyPayload';
import { getEventStatus } from '../../helpers/event';
import { keyForVerification } from '../../helpers/keys';
import { CustomTable } from '../tables/CustomTable';
import { extractParams } from '../../helpers/tables';
import { VerificationTable } from '../tables/VerificationTable';
import { RecoverableParamsTable as ParamsTable } from '../tables/ParamsTable';
import { ReferenceCard } from '../ReferenceCard';

interface Props {
	body: EventBodyPayload;
	event: EventAction;
	referenceHistory?: Array<string>;
}

export function EventBodyPayloadRenderer({ body, event, referenceHistory = [] }: Props) {
	switch (body.type) {
		case EventBodyPayloadType.MESSAGE: {
			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
					<p className='event-message-card'>{body.data}</p>
				</ErrorBoundary>
			);
		}
		case EventBodyPayloadType.TABLE: {
			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
					<CustomTable content={body.rows} />
				</ErrorBoundary>
			);
		}
		case EventBodyPayloadType.VERIFICATION: {
			const key = keyForVerification(event.parentEventId, event.eventId);

			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
					<div>
						<VerificationTable
							payload={body}
							status={getEventStatus(event)}
							keyPrefix={key}
							stateKey={`${key}-nodes`}
						/>
					</div>
				</ErrorBoundary>
			);
		}
		case EventBodyPayloadType.TREE_TABLE: {
			const { columns, rows } = extractParams(body);

			return (
				<ErrorBoundary>
					<div>
						{body.name && <div className='ac-body__item-title'>{body.name}</div>}
						<ParamsTable
							columns={columns}
							rows={rows}
							stateKey={`${event.eventId}-input-params-nodes`}
							name={event.eventName}
						/>
					</div>
				</ErrorBoundary>
			);
		}
		case EventBodyPayloadType.REFERENCE:
			return (
				<ErrorBoundary>
					<ReferenceCard eventId={body.eventId} referenceHistory={referenceHistory} />
				</ErrorBoundary>
			);
		default:
			return <JSONBodyFallback body={body} />;
	}
}

interface EventBodyCardProps {
	body: EventActionBody;
	event: EventAction;
	referenceHistory?: Array<string>;
}

export default function EventBodyCard({
	event: parentEvent,
	body,
	referenceHistory,
}: EventBodyCardProps) {
	return (
		<div className='event-card__body'>
			{body.map((eventBodyItem, index) => (
				<EventBodyPayloadRenderer
					key={`${eventBodyItem.type}-${index}`}
					body={eventBodyItem}
					event={parentEvent}
					referenceHistory={referenceHistory}
				/>
			))}
		</div>
	);
}

function JSONBodyFallback({ body }: { body: unknown }) {
	if (!body) return null;

	const content =
		typeof body === 'object' && body !== null && Object.keys(body).length > 0 ? body : null;

	return content ? (
		<div className='event-body-item fallback'>
			<pre>{JSON.stringify(content, null, 4)}</pre>
		</div>
	) : null;
}

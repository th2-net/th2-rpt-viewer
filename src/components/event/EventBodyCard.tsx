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

import { FilterEntry } from 'modules/search/stores/SearchStore';
import { useEvent } from 'hooks/useEvent';
import { EventAction } from '../../models/EventAction';
import { CustomTable } from './tables/CustomTable';
import { VerificationTable } from './tables/VerificationTable';
import { keyForVerification } from '../../helpers/keys';
import { RecoverableParamsTable as ParamsTable } from './tables/ParamsTable';
import { extractParams } from '../../helpers/tables';
import { EventBodyPayload, EventBodyPayloadType } from '../../models/EventActionPayload';
import ErrorBoundary from '../util/ErrorBoundary';
import { getEventStatus } from '../../helpers/event';
import { ReferenceCard } from './ReferenceCard';
import { wrapString } from '../../helpers/filters';

interface Props {
	body: EventBodyPayload;
	parentEvent: EventAction;
	referenceHistory?: Array<string>;
	filters?: string[];
	target?: FilterEntry;
}

export function EventBodyPayloadRenderer({
	body,
	parentEvent,
	filters,
	referenceHistory = [],
	target,
}: Props) {
	const { event: referencedEvent } = useEvent(
		body.type === EventBodyPayloadType.REFERENCE ? body.eventId : '',
	);
	const referencedBody = referencedEvent?.body || [];

	switch (body.type) {
		case EventBodyPayloadType.MESSAGE: {
			const inludingFilters = (filters ?? []).filter(f => body.data.includes(f));

			const wrappedContent = inludingFilters.length
				? wrapString(
						body.data,
						inludingFilters.map(filter => {
							const valueIndex = body.data.indexOf(filter);
							const valueRange: [number, number] = [valueIndex, valueIndex + filter.length - 1];
							return {
								type: new Set([
									valueRange[0] === target?.range[0] && valueRange[1] === target.range[1]
										? 'highlighted'
										: 'filtered',
								]),
								range: valueRange,
							};
						}),
				  )
				: body.data;

			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
					<div className='event-detail-info__message-wrapper'>
						<div key='message' className='event-detail-info__message'>
							{wrappedContent}
						</div>
					</div>
				</ErrorBoundary>
			);
		}
		case EventBodyPayloadType.TABLE: {
			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
					<CustomTable content={body.rows} key='table' filters={filters ?? []} target={target} />
				</ErrorBoundary>
			);
		}
		case EventBodyPayloadType.VERIFICATION: {
			const key = keyForVerification(parentEvent.parentEventId, parentEvent.eventId);

			return (
				<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
					<div>
						<VerificationTable
							payload={body}
							status={getEventStatus(parentEvent)}
							keyPrefix={key}
							stateKey={`${key}-nodes`}
							filters={filters ?? []}
							target={target}
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
							stateKey={`${parentEvent.eventId}-input-params-nodes`}
							name={parentEvent.eventName}
							filters={filters ?? []}
							target={target}
						/>
					</div>
				</ErrorBoundary>
			);
		}
		case EventBodyPayloadType.REFERENCE:
			return (
				<ErrorBoundary>
					<ReferenceCard
						eventId={body.eventId}
						body={referencedBody}
						referencedEvent={referencedEvent}
						referenceHistory={referenceHistory}
					/>
				</ErrorBoundary>
			);
		default:
			return <JSONBodyFallback body={body} />;
	}
}

export default function EventBodyCard({
	parentEvent,
	body,
	referenceHistory,
	filters,
	target,
}: Props) {
	return (
		<ErrorBoundary fallback={<JSONBodyFallback body={body} />}>
			<EventBodyPayloadRenderer
				body={body}
				parentEvent={parentEvent}
				referenceHistory={referenceHistory}
				filters={filters}
				target={target}
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

/** *****************************************************************************
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
 ***************************************************************************** */

import * as React from 'react';
import { EventAction } from '../../models/EventAction';
import { CustomTable } from './CustomTable';
import { VerificationTable } from './VerificationTable';
import { keyForVerification } from '../../helpers/keys';
import ParamsTable from './ParamsTable';
import { extractParams } from '../../helpers/tables';

interface Props {
	body: any;
	parentEvent: EventAction;
}

export default function EventBodyCard({ body, parentEvent }: Props) {
	if (body == null) {
		return null;
	}

	switch (body.type) {
		case 'message':
			return (
				<div key="message">
					{body.data}
				</div>
			);
		case 'table':
			return (
				<CustomTable
					content={body.fields}
					key="table"/>
			);
		case 'verification':
			// eslint-disable-next-line no-case-declarations
			const key = keyForVerification(parentEvent.parentEventId, parentEvent.eventId);

			return (
				<VerificationTable
					actionId={parentEvent.eventId as any}
					messageId={parentEvent.attachedMessageIds[0] as any}
					params={body}
					status={body.status ?? (parentEvent.successful ? 'PASSED' : 'FAILED')}
					keyPrefix={key}
					stateKey={`${key}-nodes`}/>
			);
		default:
			break;
	}

	if (!body?.fields) {
		if (Object.keys(body).length < 1) {
			return null;
		}

		return (
			<pre>{JSON.stringify(body, null, 4)}</pre>
		);
	}

	const { fields, ...restBody } = body;

	return (
		<>
			<div className="ac-body__item-title">
				Input parameters
			</div>
			<ParamsTable
				params={extractParams(body)}
				actionId={parentEvent.eventId as any}
				stateKey={`${parentEvent.eventId}-input-params-nodes`}
				name={parentEvent.eventName}/>
			<div style={{ overflow: 'auto', marginTop: '15px' }}>
				<pre>
					{ body && Object.keys(restBody).length > 0 && JSON.stringify(restBody, null, 4) }
				</pre>
			</div>
		</>
	);
}

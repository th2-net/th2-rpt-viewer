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
import MessageBody, { isSimpleValue, MessageBodyField } from '../../models/MessageBody';

const BEAUTIFIED_PAD_VALUE = 15;

interface Props {
	isBeautified: boolean;
	body: MessageBody;
}

export default function MessageBodyCard({ isBeautified, body }: Props) {
	return (
		<pre className="mc-body__human">
			{!isBeautified && '{'}
			{
				Object.entries(body.fields).map(([key, value], idx, arr) => (
					<React.Fragment key={key}>
						<MessageBodyCardField label={key} field={value} isBeautified={isBeautified}/>
						{isBeautified || idx === arr.length - 1 ? null : ', '}
					</React.Fragment>
				))
			}
			{!isBeautified && '}'}
		</pre>
	);
}

interface FieldProps {
	isBeautified: boolean;
	label: string;
	field: MessageBodyField;
}

function MessageBodyCardField({ field, label, isBeautified }: FieldProps) {
	const wrapperStyle = isBeautified
		? { display: 'block' }
		: {};

	return (
		<span style={wrapperStyle}>
			<span className="mc-body__field-label">{isBeautified ? label : `"${label}"`}: </span>
			{
				isSimpleValue(field) ? (
					`"${field.simpleValue}"`
				) : (
					<>
						{'{'}
						<span style={{ ...wrapperStyle, paddingLeft: isBeautified ? BEAUTIFIED_PAD_VALUE : undefined }}>
							{
								Object.entries(field.messageValue.fields).map(([key, subField], idx, arr) => (
									<React.Fragment key={key}>
										<MessageBodyCardField
											field={subField}
											label={key}
											isBeautified={isBeautified}/>
										{isBeautified || idx === arr.length - 1 ? null : ', '}
									</React.Fragment>
								))
							}
						</span>
						{'}'}
					</>
				)
			}
		</span>
	);
}

export function MessageBodyCardFallback({ body, isBeautified }: Props) {
	return (
		<pre className='mc-body__human'>
			{
				isBeautified ? (
					JSON.stringify(body, undefined, '  ')
				) : (
					JSON.stringify(body)
				)
			}
		</pre>
	);
}

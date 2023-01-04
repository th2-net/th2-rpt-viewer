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

import { createBemElement } from 'helpers/styleCreators';
import { ParsedMessage, EventMessage } from 'models/EventMessage';
import { Apps, CrossOriginMessage } from 'models/PostMessage';
import { normalizeFields } from '../../../helpers/message';

interface Props {
	parsedMessage?: ParsedMessage;
	message: EventMessage;
	closeMenu: () => void;
}

export const ActUIButton = (props: Props) => {
	const { parsedMessage, message, closeMenu } = props;
	return (
		<div>
			{parsedMessage && (
				<div
					title='Send to history'
					className='message-card-tools__item'
					onClick={() => {
						const isDev = process.env.NODE_ENV === 'development';

						window.parent.postMessage(
							{
								payload: {
									...message,
									jsonBody: JSON.stringify(
										normalizeFields(parsedMessage.message.fields),
										null,
										'    ',
									),
								} as unknown,
								action: 'replayMessage',
								publisher: Apps.ReportViewer,
							} as CrossOriginMessage,
							isDev ? 'http://localhost:9002' : window.location.origin,
						);
						closeMenu();
					}}>
					<div className='message-card-tools__copy-icon' />
					<span className='message-card-tools__item-title'>Send to replay</span>
					<div className={createBemElement('message-card-tools', 'indicator', 'bookmark')} />
				</div>
			)}
		</div>
	);
};

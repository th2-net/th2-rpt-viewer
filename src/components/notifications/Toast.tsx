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

import { ToastProps } from 'react-toast-notifications';
import { createStyleSelector } from '../../helpers/styleCreators';

export default function Toast(props: ToastProps) {
	const { appearance, children, onDismiss, transitionState } = props;
	const toastMessageClassname = createStyleSelector('toast-message', appearance, transitionState);
	const toastMessageIconClassname = createStyleSelector('toast-message__icon', appearance);

	return (
		<div className={toastMessageClassname}>
			<div className={toastMessageIconClassname} />
			<div className='toast-message__content'>{children}</div>
			<button className='toast-message__close' onClick={() => onDismiss()} />
		</div>
	);
}

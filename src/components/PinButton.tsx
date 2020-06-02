/** ****************************************************************************
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
import { createStyleSelector, createBemElement } from '../helpers/styleCreators';
import '../styles/buttons.scss';

interface Props {
    onClick?: Function;
	isDisabled?: boolean;
	color?: string;
}

const PinButton = ({
	isDisabled = false,
}: Props) => {
	const [isPinned, setIsPinned] = React.useState(false);
	const className = createStyleSelector(
		'pin-button',
		isDisabled ? 'disabled' : null,
	);

	const title = isPinned ? 'Unpin' : 'Pin';

	const pinClassName = createBemElement(
		'pin-button',
		'icon',
		isPinned ? 'active' : null,
	);

	return (
		<div
			className={className}
			title={title}
			onClick={() => setIsPinned(!isPinned)}>
			<div className={pinClassName} />
			<div>{title}</div>
		</div>
	);
};

export default PinButton;

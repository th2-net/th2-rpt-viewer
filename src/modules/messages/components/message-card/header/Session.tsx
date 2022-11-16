/** ****************************************************************************
 * Copyright 2020-2022 Exactpro (Exactpro Systems Limited)
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
import { Chip } from 'components/Chip';
import { createStyleSelector } from 'helpers/styleCreators';

/* eslint-disable no-bitwise */
export function getHashCode(str: string): number {
	let hash = 0;
	let i;
	let chr;

	if (str.length === 0) {
		return hash;
	}

	for (i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Convert to 32bit integer
	}

	return hash;
}

const HUE_SEGMENTS_COUNT = 36;

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}

interface Props {
	sessionId: string;
	direction: string;
}

export function Session(props: Props) {
	const { sessionId, direction } = props;

	// session arrow color, we calculating it for each session from-to pair, based on hash
	const sessionBackgroundStyle: React.CSSProperties = {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		zIndex: 0,
		borderRadius: 20,
		backgroundColor: '#666',
		filter: `invert(1) sepia(1) saturate(5) hue-rotate(${React.useMemo(
			() => calculateHueValue(sessionId),
			[sessionId],
		)}deg)`,
	};

	const sessionClass = createStyleSelector(
		'mc-header__icon mc-header__direction-icon',
		direction?.toLowerCase(),
	);

	return (
		<Chip title={`Session: ${sessionId}`} className='mc-header__sessionId'>
			<div style={sessionBackgroundStyle} />
			<span className={sessionClass} />
			<span className='mc-header__session-id'>{sessionId}</span>
		</Chip>
	);
}

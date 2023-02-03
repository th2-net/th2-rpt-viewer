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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';

export function useOutsideClickListener(
	ref: React.MutableRefObject<HTMLElement | null>,
	handler: (e: MouseEvent) => void,
	isOpen?: boolean,
	eventType: 'mousedown' | 'mouseup' = 'mousedown',
) {
	const onOutsideClick = (e: MouseEvent) => {
		if (ref && !ref.current?.contains(e.target as Element)) {
			handler(e);
		}
	};

	React.useEffect(() => {
		if (isOpen === undefined || isOpen) {
			document.addEventListener(eventType, onOutsideClick);

			return () => {
				document.removeEventListener(eventType, onOutsideClick);
			};
		}
	}, [handler, isOpen]);
}

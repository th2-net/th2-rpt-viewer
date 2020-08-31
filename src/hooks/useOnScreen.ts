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

import React from 'react';

export function useOnScreen(ref: React.MutableRefObject<HTMLElement | null>, rootMargin = '0px') {
	// State and setter for storing whether element is visible
	const [isIntersecting, setIntersecting] = React.useState(false);

	React.useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
			// Update our state when observer callback fires
				setIntersecting(entry.isIntersecting);
			},
			{
				rootMargin,
			},
		);
		if (ref.current) {
			observer.observe(ref.current);
		}
		return () => {
			observer.unobserve(ref.current!);
		};
	}, []); // Empty array ensures that effect is only run on mount and unmount

	return isIntersecting;
}

/** *****************************************************************************
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
import ResizeObserver from 'resize-observer-polyfill';

const useElementSize = (target: HTMLDivElement | null) => {
	const [size, setSize] = React.useState<DOMRectReadOnly>();

	const resizeObserver = new ResizeObserver(entries =>
		setSize(entries[0]?.contentRect as DOMRectReadOnly),
	);

	React.useLayoutEffect(() => {
		if (target) {
			setSize(target.getBoundingClientRect());
			resizeObserver.observe(target);
		}
		return () => {
			resizeObserver.disconnect();
		};
	}, [target]);

	return size;
};

export default useElementSize;

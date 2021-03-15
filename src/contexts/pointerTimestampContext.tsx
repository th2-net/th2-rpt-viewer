/** *****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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

const PointerTimestampContext = React.createContext<number | null>(null);
const PointerTimestampUpdateContext = React.createContext<
	React.Dispatch<React.SetStateAction<number | null>>
	// eslint-disable-next-line @typescript-eslint/no-empty-function
>(() => {});

export const usePointerTimestamp = () => React.useContext(PointerTimestampContext);

export const usePointerTimestampUpdate = () => React.useContext(PointerTimestampUpdateContext);

export default function PointerTimestampProvider({ children }: { children: React.ReactNode }) {
	const [timestamp, setTimestamp] = React.useState<number | null>(null);

	return (
		<PointerTimestampContext.Provider value={timestamp}>
			<PointerTimestampUpdateContext.Provider value={setTimestamp}>
				{children}
			</PointerTimestampUpdateContext.Provider>
		</PointerTimestampContext.Provider>
	);
}

/** ****************************************************************************
 * Copyright 2024-2025 Exactpro (Exactpro Systems Limited)
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

import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import { LEAF_BACKGROUND_COLORS, LEAF_COLORS } from './TreeLeaf';
import { Chunk } from '../../stores/JSONViewer/Chunk';

const EmptyLeaf = ({
	chunkNode,
	type,
}: {
	chunkNode: Chunk;
	type: PanelType;
	nextNodeTimestamp?: number;
	nextNodeChunk?: number;
}) => {
	const JSONViewerStore = useJSONViewerStore();
	const borderSide = type === 'default' ? 'Right' : 'Left';
	const otherBorderSide = type === 'default' ? 'Left' : 'Right';

	const chunkColor = useMemo(
		() => JSONViewerStore.intervalsColor[chunkNode.chunkId],
		[JSONViewerStore.intervalsColor],
	);

	return (
		<div
			className='leaf'
			style={{
				height: chunkNode.visibleHeight,
				backgroundColor: LEAF_BACKGROUND_COLORS[chunkColor],
				[`border${borderSide}Color`]: LEAF_COLORS[chunkColor],
				[`border${borderSide}Width`]: '5px',
				[`borderTop${borderSide}Radius`]: '0px',
				[`borderBottom${borderSide}Radius`]: '0px',
				[`borderBottomColor`]: LEAF_COLORS[chunkColor],
				[`borderBottomWidth`]: undefined,
				[`borderBottom${otherBorderSide}Radius`]: undefined,
				padding: '5px',
				flexDirection: 'row',
				justifyContent: borderSide === 'Left' ? 'flex-start' : 'flex-end',
				alignItems: 'center',
			}}></div>
	);
};

export default observer(EmptyLeaf);

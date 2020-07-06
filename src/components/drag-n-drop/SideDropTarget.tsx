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
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/dragndrop.scss';

interface SideDropTargetProps {
	canDrop: boolean;
	style?: React.CSSProperties;
	yCoord: null | number;
}

const SideDropTarget = (props: SideDropTargetProps) => {
	const {
		canDrop,
		style = {},
		yCoord,
	} = props;
	return (
		<AnimatePresence initial={false}>
			{canDrop && (
				<motion.div
					className="with-side-drop-target__overlay"
					style={style}
					positionTransition
					transition={{
						bounceDamping: 0,
						bounceStiffness: 0,
						duration: 0.4,
					}}
					initial={{
						width: 0,
						height: 0,
						opacity: 0,
						top: yCoord || 0,
					}}
					animate={{
						width: '50%',
						height: '100%',
						top: 0,
						opacity: 1,
					}}
					exit={{
						width: 0,
						height: 0,
						opacity: 0,
						top: '50%',
					}}/>
			)}
		</AnimatePresence>
	);
};

export default SideDropTarget;

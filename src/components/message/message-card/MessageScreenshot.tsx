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

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import KeyCodes from '../../../models/util/KeyCodes';

interface Props {
	src: string;
	alt: string;
}

export function MessageScreenshotZoom(props: Props) {
	const [isOpen, setOpen] = useState(false);

	const hideImage = React.useCallback(() => isOpen && setOpen(false), [isOpen]);

	const onKeyDown = React.useCallback(
		(e: Event) => {
			if (e instanceof KeyboardEvent) {
				const key = e.key || e.keyCode;
				if (key === 'Escape' || key === 'Esc' || key === KeyCodes.ESCAPE) {
					hideImage();
				}
			}
		},
		[hideImage],
	);

	React.useEffect(() => {
		if (isOpen) {
			document.body.addEventListener('keydown', onKeyDown);
		}

		return () => {
			document.body.removeEventListener('keydown', onKeyDown);
		};
	}, [isOpen]);

	return (
		<div className={`zoomed-message ${isOpen ? 'open' : ''}`}>
			<motion.div animate={{ opacity: isOpen ? 1 : 0 }} className='shade' onClick={hideImage} />
			<motion.img {...props} onClick={() => setOpen(!isOpen)} layout />
		</div>
	);
}

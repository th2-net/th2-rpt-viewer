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

import { createStyleSelector } from 'helpers/styleCreators';
import '../../styles/icons.scss';

interface BookmarkIconProps {
	isPinned: boolean;
	onClick?: (e: React.MouseEvent) => void;
	className?: string;
}

export function BookmarkIcon(props: BookmarkIconProps) {
	const { className = '', isPinned, onClick } = props;
	const rootClassName = createStyleSelector(
		'bookmark-icon',
		className,
		isPinned ? 'pinned' : null,
		onClick ? 'clickable' : null,
	);
	return (
		<div
			title={onClick ? (isPinned ? 'Remove bookmark' : 'Bookmark') : undefined}
			onClick={onClick}
			className={rootClassName}></div>
	);
}

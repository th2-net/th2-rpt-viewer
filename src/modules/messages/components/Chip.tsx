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

interface Props
	extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	additionalClassName?: string;
	isSelected?: boolean;
	isLoading?: boolean;
	children?: React.ReactNode;
}

export function Chip(props: Props) {
	const {
		className = '',
		isSelected,
		onClick,
		title,
		isLoading,
		onMouseEnter,
		onMouseLeave,
		children,
	} = props;
	const rootClass = createStyleSelector(
		'chip',
		isSelected ? 'selected' : null,
		onClick ? 'clickable' : null,
		isLoading ? 'loading' : null,
		className,
	);

	return (
		<div
			className={rootClass}
			title={title}
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}>
			{children}
		</div>
	);
}

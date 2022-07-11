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

import * as React from 'react';
import { createStyleSelector } from '../helpers/styleCreators';

interface Props {
	text?: string | number;
	className?: string;
	additionalClassName?: string;
	title?: string;
	isSelected?: boolean;
	isLoading?: boolean;
	onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	onMouseEnter?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	onMouseLeave?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	children?: React.ReactNode;
}

export function Chip(props: Props) {
	const {
		text,
		className,
		additionalClassName,
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
		additionalClassName || null,
	);

	return (
		<div
			className={className || rootClass}
			title={title}
			onClick={e => onClick && onClick(e)}
			onMouseEnter={e => onMouseEnter && onMouseEnter(e)}
			onMouseLeave={e => onMouseLeave && onMouseLeave(e)}>
			{children || <p>{text}</p>}
		</div>
	);
}

/** ****************************************************************************
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
import { StatusType } from '../models/Status';
import { getStatusChipDescription } from '../helpers/action';
import { createStyleSelector } from '../helpers/styleCreators';
import '../styles/chip.scss';

interface Props {
    text: string | number;
    title?: string;
    status?: StatusType;
    isSelected?: boolean;
    isLoading?: boolean;
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export function Chip({
	status, text, isSelected, onClick, title, isLoading,
}: Props) {
	const rootClass = createStyleSelector(
		'chip',
		status || null,
		isSelected ? 'selected' : null,
		onClick ? 'clickable' : null,
		isLoading ? 'loading' : null,
	);

	return (
		<div className={rootClass}
			title={title ?? getStatusChipDescription(status)}
			onClick={e => onClick && onClick(e)}>
			<div className="chip__title">
				<p>{text}</p>
			</div>
		</div>
	);
}

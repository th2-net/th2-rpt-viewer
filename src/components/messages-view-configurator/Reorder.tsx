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
 * limitations under the License.
 ***************************************************************************** */

import React from 'react';

interface ReorderProps {
	isFirst: boolean | null;
	isLast: boolean | null;
	index: number;
	move: (from: number, to: number) => void;
}

const Reorder = ({ isFirst, isLast, index, move }: ReorderProps) => {
	if ((isFirst === null && isLast === null) || (isFirst && isLast)) return null;
	return (
		<div className='reorder'>
			{!isFirst && (
				<button
					className='reorder-control up'
					onClick={(e: React.MouseEvent) => {
						e.stopPropagation();
						move(index, index - 1);
					}}
				/>
			)}
			{!isLast && (
				<button
					className='reorder-control down'
					onClick={(e: React.MouseEvent) => {
						e.stopPropagation();
						move(index, index + 1);
					}}
				/>
			)}
		</div>
	);
};

export default Reorder;

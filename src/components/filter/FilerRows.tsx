/** ****************************************************************************
 * Copyright 2022-2022 Exactpro (Exactpro Systems Limited)
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
import { FilterRowConfig } from '../../models/filter/FilterInputs';
import FilterRow from './row';
import { createStyleSelector } from '../../helpers/styleCreators';

interface Props {
	config: FilterRowConfig[];
	headerClassName?: string;
	onMouseOver?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export function FilterRows({ config, headerClassName, onMouseOver }: Props) {
	const compoundHeaderClassName = createStyleSelector(
		'filter__compound-header',
		headerClassName ? headerClassName : null,
	);

	return (
		<div className='filter'>
			{config.map(rowConfig =>
				Array.isArray(rowConfig) ? (
					<div
						onMouseOver={onMouseOver}
						className='filter__compound'
						key={rowConfig.map(c => c.id).join('-')}>
						<div className={compoundHeaderClassName}>
							{rowConfig
								.filter(_rowConfig => _rowConfig.label)
								.map(_rowConfig => (
									<p className={'filter-row__label'} key={_rowConfig.label}>
										{_rowConfig.label}
									</p>
								))}
							<div className='filter__togglers'>
								{rowConfig
									.filter(_rowConfig => _rowConfig.type !== 'multiple-strings')
									.map(_rowConfig => (
										<FilterRow rowConfig={_rowConfig} key={_rowConfig.id} />
									))}
							</div>
						</div>
						{rowConfig
							.filter(_rowConfig => _rowConfig.type === 'multiple-strings')
							.map(_rowConfig => (
								<FilterRow rowConfig={_rowConfig} key={_rowConfig.id} />
							))}
					</div>
				) : (
					<FilterRow rowConfig={rowConfig} key={rowConfig.id} />
				),
			)}
		</div>
	);
}

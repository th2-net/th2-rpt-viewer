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

import React, { useState, useRef, useEffect } from 'react';
import '../../styles/multiselect.scss';
import { ModalPortal } from './Portal';
import { raf } from '../../helpers/raf';
import { useOutsideClickListener } from '../../hooks';

interface Props<T> {
	className?: string;
	options: Array<T>;
	onChange: (selected: Array<T>) => void;
	selected?: Array<T>;
}

function MultiSelect<T>({ options, onChange, selected = [], className = '' }: Props<T>) {
	const [selectedValues, setSelectedValues] = useState<T[]>(selected || []);
	const [isOpen, setIsOpen] = useState(false);
	const [isAllSelected, setIsAllSelected] = useState(false);
	const [partialSelect, setPartialSelect] = useState(0);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const multiselectBodyRef = useRef<HTMLDivElement>(null);
	const indeterminateCheckboxRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (selectedValues.length === 0) {
			setIsAllSelected(false);
			setPartialSelect(0);
		} else if (selectedValues.length === options.length) {
			setIsAllSelected(true);
			setPartialSelect(2);
		} else {
			setIsAllSelected(false);
			setPartialSelect(1);
		}
	}, [selectedValues, options.length]);

	useEffect(() => {
		if (indeterminateCheckboxRef.current) {
			indeterminateCheckboxRef.current.indeterminate = partialSelect === 1;
		}
	}, [partialSelect]);

	const handleSelectAll = () => {
		if (!isAllSelected) {
			setSelectedValues([...options]);
		} else {
			setSelectedValues([]);
		}
	};

	const handlePartialSelect = () => {
		if (partialSelect === 0 || partialSelect === 1) {
			setSelectedValues([...options]);
		} else {
			setSelectedValues([]);
		}
	};

	const handleSelect = (value: T) => {
		const newSelectedValues = selectedValues.includes(value)
			? selectedValues.filter(v => v !== value)
			: [...selectedValues, value];

		setSelectedValues(newSelectedValues);
		if (onChange) {
			onChange(newSelectedValues);
		}
	};

	const toggleDropdown = () => setIsOpen(!isOpen);

	React.useLayoutEffect(() => {
		if (isOpen) {
			raf(() => {
				if (multiselectBodyRef.current && dropdownRef.current) {
					const { left, bottom } = dropdownRef.current.getBoundingClientRect();
					const clientWidth = document.documentElement.clientWidth;

					let calculatedWidth = multiselectBodyRef.current.clientWidth;
					const leftPosition = left;

					if (left + calculatedWidth > clientWidth) {
						calculatedWidth = clientWidth - left - 10;
					}

					multiselectBodyRef.current.style.left = `${leftPosition}px`;
					multiselectBodyRef.current.style.top = `${bottom}px`;
					multiselectBodyRef.current.style.width = `${calculatedWidth}px`;
				}
			}, 2);
		}
	}, [isOpen]);

	useOutsideClickListener(
		multiselectBodyRef,
		(e: MouseEvent) => {
			if (
				e.target instanceof Element &&
				!multiselectBodyRef.current?.contains(e.target) &&
				!dropdownRef.current?.contains(e.target)
			) {
				setIsOpen(false);
			}
		},
		isOpen,
	);

	return (
		<div className={`multiselect ${className}`}>
			<div ref={dropdownRef} className='dropdown-header' onClick={toggleDropdown}>
				<div className='dropdown-header__text'>
					{selectedValues.length > 0 ? selectedValues.join(', ') : ''}
				</div>
			</div>
			<ModalPortal isOpen={isOpen}>
				<div ref={multiselectBodyRef} className='dropdown-menu'>
					<ul className='dropdown-list'>
						<li className='dropdown-item' onClick={handlePartialSelect}>
							<input
								type='checkbox'
								className='indeterminate-checkbox'
								checked={partialSelect === 2}
								ref={indeterminateCheckboxRef}
								readOnly
							/>
							{partialSelect === 0 ? '0 Selected' : `${selectedValues.length} Selected`}
						</li>

						<li className='dropdown-item' onClick={handleSelectAll}>
							<input type='checkbox' checked={isAllSelected} readOnly />
							Select All
						</li>

						{options.map(option => (
							<li
								key={String(option)}
								className={`dropdown-item ${selectedValues.includes(option) ? 'selected' : ''}`}
								onClick={() => handleSelect(option)}>
								<input
									type='checkbox'
									checked={selectedValues.includes(option)}
									onChange={() => handleSelect(option)}
								/>
								{option}
							</li>
						))}
					</ul>
				</div>
			</ModalPortal>
		</div>
	);
}

export default MultiSelect;

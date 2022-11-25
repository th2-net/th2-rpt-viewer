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

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

interface IToggleButtonContext<T> {
	selectedOption: T;
	setSelectedOption: (value: T) => void;
}

const ToggleButtonContext = createContext({} as IToggleButtonContext<any>);

type ToggleButtonGroupProps<T> = React.PropsWithChildren<{
	onChange: (value: T) => void;
	value: T;
	className?: string;
}>;

export const ToggleButtonGroup = <T,>(props: ToggleButtonGroupProps<T>) => {
	const { value, onChange, children, className = '' } = props;
	const [selectedOption, setSelectedOption] = useState(value);

	useEffect(() => {
		setSelectedOption(value);
	}, [value]);

	const state: IToggleButtonContext<T> = useMemo(
		() => ({
			selectedOption,
			setSelectedOption: option => {
				onChange(option);
				setSelectedOption(option);
			},
		}),
		[selectedOption, setSelectedOption],
	);

	return (
		<ToggleButtonContext.Provider value={state}>
			<div className={clsx('toggle-button-group', className)}>{children}</div>
		</ToggleButtonContext.Provider>
	);
};

type ToggleButtonProps = React.PropsWithChildren<{
	className?: string;
	activeClassName?: string;
	value: string;
	style?: React.CSSProperties;
}>;

export const ToggleButton = (props: ToggleButtonProps) => {
	const { activeClassName = '', value, className = '', style = {} } = props;
	const { selectedOption, setSelectedOption } = useContext(ToggleButtonContext);

	const isSelected = selectedOption === value;

	const buttonClassName = clsx('toggle-button', 'button-base', className, {
		selected: isSelected,
		[activeClassName]: isSelected,
	});

	const onClick = () => setSelectedOption(value);

	return (
		<button className={buttonClassName} onClick={onClick} style={style}>
			{props.children}
		</button>
	);
};

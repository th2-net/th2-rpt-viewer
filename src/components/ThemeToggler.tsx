import { useLayoutEffect, useState } from 'react';

export const ThemeToggler = () => {
	const [theme, setTheme] = useState(() => {
		let defaultTheme = localStorage.getItem('theme');

		if (
			!defaultTheme &&
			window.matchMedia &&
			window.matchMedia('(prefers-color-scheme: dark)').matches
		) {
			defaultTheme = 'dark';
		}

		return defaultTheme || 'light';
	});

	useLayoutEffect(() => {
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}, [theme]);

	return (
		<div className='theme-toggler'>
			<span>{theme}</span>
			<div>
				<input
					type='checkbox'
					className='theme-toggler__checkbox'
					id='theme'
					onChange={e => setTheme(e.target.checked ? 'dark' : 'light')}
					checked={theme === 'dark'}
				/>
				<label className='theme-toggler__label label' htmlFor='theme'>
					<div className='theme-toggler__ball ball'></div>
				</label>
			</div>
		</div>
	);
};

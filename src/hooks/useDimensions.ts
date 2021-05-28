import { RefObject, useEffect, useRef, useState } from 'react';

function useDimensions<T extends HTMLElement>(live?: boolean): [RefObject<T>, DOMRect | null] {
	const ref = useRef<T>(null);
	const [dimensions, setDimensions] = useState<DOMRect | null>(null);

	const measure = () =>
		window.requestAnimationFrame(() => {
			if (ref.current) {
				const rects = ref.current.getBoundingClientRect();
				setDimensions(rects);
			}
		});

	// eslint-disable-next-line consistent-return
	useEffect(() => {
		measure();
		if (live) {
			window.addEventListener('resize', measure);
			window.addEventListener('scroll', measure);
			return () => {
				window.removeEventListener('resize', measure);
				window.removeEventListener('scroll', measure);
			};
		}
	}, [live]);

	return [ref, dimensions];
}

export default useDimensions;

import * as React from 'react';

interface SeparatorProps {
	index: number;
	onChange: (indexes: number, value: number) => void;
	onBtnUp?: () => void;
	isHeader?: boolean;
}

export const ColumnSeparator = ({ index, onChange, onBtnUp, isHeader = false }: SeparatorProps) => {
	const pointerRef = React.useRef<HTMLTableCellElement>(null);
	const startOffset = React.useRef(0);
	const isDown = React.useRef(false);
	function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
		const pointerEl = pointerRef.current;
		if (!pointerEl) {
			return;
		}
		isDown.current = true;
		startOffset.current = e.clientX;
		document.addEventListener('mousemove', handleMouseDrag);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseDrag(e: MouseEvent) {
		e.preventDefault();
		const pointerEl = pointerRef.current;
		if (!isDown.current || !pointerEl) {
			return;
		}
		const diff = e.clientX - startOffset.current;
		onChange(index, diff);
	}

	function handleMouseUp() {
		isDown.current = false;
		startOffset.current = 0;
		if (onBtnUp) onBtnUp();
		document.removeEventListener('mousemove', handleMouseDrag);
		document.removeEventListener('mouseup', handleMouseUp);
	}

	return isHeader ? (
		<th className='columnSeparator' onMouseDown={handleMouseDown} ref={pointerRef} />
	) : (
		<td className='columnSeparator' onMouseDown={handleMouseDown} ref={pointerRef} />
	);
};

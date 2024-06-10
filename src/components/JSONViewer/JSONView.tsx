import React from 'react';
import { observer } from 'mobx-react-lite';
import debounce from 'lodash.debounce';
import { TreeNode } from '../../models/JSONSchema';
import { createBemElement } from '../../helpers/styleCreators';

const BEAUTIFIED_PAD_VALUE = 15;

interface JSONViewProps {
	node: TreeNode;
	isBeautified: boolean;
	isArrayElement?: boolean;
	setIsHighlighted?: (isHighlighted: boolean) => void;
}

interface JSONViewFieldsReqProps {
	label: string;
	isBeautified: boolean;
	isArrayElement?: boolean;
	setIsHighlighted: (isHighlighted: boolean) => void;
	field: any;
}

const JSONViewSimpleField = ({
	label,
	field,
	isBeautified,
	isArrayElement,
	setIsHighlighted,
}: JSONViewFieldsReqProps) => {
	const highlight = React.useMemo(() => debounce(() => setIsHighlighted(true), 60), []);

	const removeHighlight = React.useCallback(() => {
		highlight.cancel();
		setIsHighlighted(false);
	}, [highlight]);

	return (
		<span
			className='mc-body__field'
			style={{
				display: isBeautified ? 'block' : undefined,
			}}>
			<span
				onMouseEnter={highlight}
				onMouseLeave={removeHighlight}
				className='mc-body__field-label'>
				{label && !isArrayElement ? `${label}: ` : ''}
			</span>
			<span
				onMouseEnter={highlight}
				onMouseLeave={removeHighlight}
				className='mc-body__field-simple-value'>
				{typeof field === 'object' ? JSON.stringify(field) : String(field)}
			</span>
		</span>
	);
};

const JSONView = ({ node, isBeautified, setIsHighlighted, isArrayElement }: JSONViewProps) => {
	const [areSameContext, highlightSameContext] = React.useState(false);

	const highlight = React.useMemo(
		() =>
			debounce(() => {
				if (setIsHighlighted) setIsHighlighted(true);
			}, 60),
		[],
	);

	const removeHighlight = React.useCallback(() => {
		highlight.cancel();
		if (setIsHighlighted) setIsHighlighted(false);
	}, [highlight]);

	return (
		<pre className='mc-body__human' style={{ display: isBeautified ? 'block' : 'inline' }}>
			<span
				className='mc-body__field'
				style={{
					display: isBeautified ? 'block' : undefined,
				}}
				onMouseEnter={highlight}
				onMouseLeave={removeHighlight}>
				<span className='mc-body__field-label'>
					{!node.isGeneratedKey && node.key !== '' && !isArrayElement ? `${node.key}:` : ''}
				</span>
				<span
					className={createBemElement('mc-body', 'field-border', areSameContext ? 'active' : null)}>
					{node.isArray ? '[' : '{'}
				</span>
				<span
					style={{
						display: isBeautified ? 'block' : undefined,
						paddingLeft: isBeautified ? BEAUTIFIED_PAD_VALUE : undefined,
					}}>
					{node.simpleFields.map(({ key, value }, idx, arr) => (
						<React.Fragment key={key}>
							<JSONViewSimpleField
								label={key}
								field={value}
								isArrayElement={node.isArray}
								isBeautified={isBeautified}
								setIsHighlighted={highlightSameContext}
							/>
							{isBeautified || idx === arr.length - 1 ? null : ', '}
						</React.Fragment>
					))}
					{isBeautified || node.simpleFields.length === 0 || node.complexFields.length === 0
						? null
						: ', '}
					{node.complexFields.map((n, idx, arr) => (
						<React.Fragment key={n.id}>
							<JSONView
								node={n}
								isArrayElement={node.isArray}
								isBeautified={isBeautified}
								setIsHighlighted={highlightSameContext}
							/>
							{isBeautified || idx === arr.length - 1 ? null : ', '}
						</React.Fragment>
					))}
				</span>
				<span
					className={createBemElement('mc-body', 'field-border', areSameContext ? 'active' : null)}>
					{node.isArray ? ']' : '}'}
				</span>
			</span>
		</pre>
	);
};

export default observer(JSONView);

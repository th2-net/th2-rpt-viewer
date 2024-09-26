import React from 'react';
import { observer } from 'mobx-react-lite';
import debounce from 'lodash.debounce';
import { TreeNode } from '../../models/JSONSchema';
import { createBemElement } from '../../helpers/styleCreators';
import SearchToken from '../../models/search/SearchToken';
import { getKeyValueTokens } from '../../helpers/search/getSpecificTokens';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';

const BEAUTIFIED_PAD_VALUE = 15;

interface JSONViewProps {
	node: TreeNode;
	isBeautified: boolean;
	isArrayElement?: boolean;
	setIsHighlighted?: (isHighlighted: boolean) => void;
	tokens: SearchToken[];
}

interface JSONViewFieldsReqProps {
	label: string;
	isBeautified: boolean;
	isArrayElement?: boolean;
	setIsHighlighted: (isHighlighted: boolean) => void;
	field: any;
	tokens: SearchToken[];
}

const JSONViewSimpleField = ({
	label,
	field,
	isBeautified,
	isArrayElement,
	setIsHighlighted,
	tokens,
}: JSONViewFieldsReqProps) => {
	const highlight = React.useMemo(() => debounce(() => setIsHighlighted(true), 60), []);
	const valueString =
		typeof field === 'object'
			? JSON.stringify(field)
			: typeof field === 'string'
			? `"${field}"`
			: String(field);
	const keyValueTokens = getKeyValueTokens(tokens, true).filter(
		({ isOne, keyToken, valueToken }) =>
			!isOne ||
			(`${label}:`.endsWith(keyToken.pattern) && valueString.startsWith(valueToken.pattern)),
	);

	const keyTokens = keyValueTokens.map(({ keyToken }) => keyToken);
	const valueTokens = keyValueTokens.map(({ valueToken }) => valueToken);

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
				{label && !isArrayElement
					? multiTokenSplit(`${label}: `, keyTokens).map((contentPart, index) => (
							<span
								key={index}
								className={contentPart.token != null ? 'found-content' : undefined}
								style={{ backgroundColor: contentPart.token?.color }}>
								{contentPart.content}
							</span>
					  ))
					: ''}
			</span>
			<span
				onMouseEnter={highlight}
				onMouseLeave={removeHighlight}
				className='mc-body__field-simple-value'>
				{multiTokenSplit(valueString, valueTokens).map((contentPart, index) => (
					<span
						key={index}
						className={contentPart.token != null ? 'found-content' : undefined}
						style={{ backgroundColor: contentPart.token?.color }}>
						{contentPart.content}
					</span>
				))}
			</span>
		</span>
	);
};

const JSONView = ({
	node,
	isBeautified,
	setIsHighlighted,
	isArrayElement,
	tokens,
}: JSONViewProps) => {
	const [areSameContext, highlightSameContext] = React.useState(false);
	const keyValueTokens = getKeyValueTokens(tokens, true).filter(
		({ isOne, keyToken, valueToken }) =>
			!isOne || (`${node.key}:`.endsWith(keyToken.pattern) && valueToken.pattern === ''),
	);

	const keyTokens = keyValueTokens.map(({ keyToken }) => keyToken);

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
					{!node.isGeneratedKey && node.key !== '' && !isArrayElement
						? multiTokenSplit(`${node.key}:`, keyTokens).map((contentPart, index) => (
								<span
									key={index}
									className={contentPart.token != null ? 'found-content' : undefined}
									style={{ backgroundColor: contentPart.token?.color }}>
									{contentPart.content}
								</span>
						  ))
						: ''}
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
								tokens={tokens}
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
								tokens={tokens}
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

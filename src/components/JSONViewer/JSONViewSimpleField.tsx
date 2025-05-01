/** ****************************************************************************
 * Copyright 2024-2025 Exactpro (Exactpro Systems Limited)
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
import { observer } from 'mobx-react-lite';
import debounce from 'lodash.debounce';
import { createBemElement } from '../../helpers/styleCreators';
import SearchToken from '../../models/search/SearchToken';
import { getKeyValueTokens } from '../../helpers/search/getSpecificTokens';
import multiTokenSplit from '../../helpers/search/multiTokenSplit';
import { useJSONViewerStore } from '../../hooks/useJSONViewerStore';
import { PanelType } from '../../stores/JSONViewer/JSONViewerStore';
import { TreeNode } from '../../stores/JSONViewer/TreeNode';

const BEAUTIFIED_PAD_VALUE = 15;

interface JSONViewProps {
	type: PanelType;
	node: TreeNode;
	isBeautified: boolean;
	isArrayElement?: boolean;
	setIsHighlighted?: (isHighlighted: boolean) => void;
	tokens: SearchToken[];
}

interface JSONViewFieldsReqProps {
	id: number;
	type: PanelType;
	label: string;
	isBeautified: boolean;
	isArrayElement?: boolean;
	setIsHighlighted: (isHighlighted: boolean) => void;
	field: any;
	tokens: SearchToken[];
}

const JSONViewSimpleField = ({
	id,
	type,
	label,
	field,
	isBeautified,
	isArrayElement,
	setIsHighlighted,
}: JSONViewFieldsReqProps) => {
	const JSONViewerStore = useJSONViewerStore();
	const highlight = React.useMemo(() => debounce(() => setIsHighlighted(true), 60), []);
	const valueString =
		typeof field === 'object'
			? JSON.stringify(field)
			: typeof field === 'string'
			? `"${field}"`
			: String(field);
	const row = `${label}:${field}`;
	const keyValueTokens = getKeyValueTokens(JSONViewerStore.tokens, true).filter(
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
					? JSONViewerStore.compareBodyResults(
							type,
							id,
							row,
							'key',
							multiTokenSplit(`${label}: `, keyTokens),
					  ).map((contentPart, index) => (
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
				{JSONViewerStore.compareBodyResults(
					type,
					id,
					row,
					'value',
					multiTokenSplit(valueString, valueTokens),
				).map((contentPart, index) => (
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
	type,
	node,
	isBeautified,
	setIsHighlighted,
	isArrayElement,
	tokens,
}: JSONViewProps) => {
	const JSONViewerStore = useJSONViewerStore();
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
						<React.Fragment key={`${key}-${JSONViewerStore.currentSearchResult[type]}`}>
							<JSONViewSimpleField
								id={node.id}
								type={type}
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
								type={type}
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

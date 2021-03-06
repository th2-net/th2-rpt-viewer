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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import MessageBody, {
	isSimpleValue,
	MessageBodyField,
	isListValue,
	MessageBodyFields,
	isMessageValue,
} from '../../../models/MessageBody';
import { useMessageBodySortStore } from '../../../hooks';

const BEAUTIFIED_PAD_VALUE = 15;
const DEFAULT_HIGHLIGHT_COLOR = '#e2dfdf';
const SELECTED_HIGHLIGHT_COLOR = '#fff';

interface Props {
	isBeautified: boolean;
	body: MessageBody | null;
	isSelected: boolean;
	renderInfo: () => React.ReactNode;
}

const getSortedFields = (fields: MessageBodyFields, sortOrder: string[]) => {
	const primarySortedFields: [string, MessageBodyField][] = Object.entries(
		sortOrder.reduce((prev, curr) => (fields[curr] ? { ...prev, [curr]: fields[curr] } : prev), {}),
	);

	const secondarySortedFields: [string, MessageBodyField][] = Object.entries(fields)
		.filter(([key]) => !sortOrder.includes(key))
		.sort((a: [string, MessageBodyField], b: [string, MessageBodyField]) => {
			const [keyA] = a;
			const [keyB] = b;
			return keyA.toLowerCase() > keyB.toLowerCase() ? 1 : -1;
		});

	return [...primarySortedFields, ...secondarySortedFields];
};

function MessageBodyCard({ isBeautified, body, isSelected, renderInfo }: Props) {
	const [areSiblingsHighlighed, highlightSiblings] = React.useState(false);
	const { sortOrderItems } = useMessageBodySortStore();

	const fields = React.useMemo(
		() => getSortedFields(body?.fields ? body.fields : {}, sortOrderItems),
		[body, sortOrderItems],
	);

	if (body == null) {
		return <pre className='mc-body__human'>null</pre>;
	}

	return (
		<pre className='mc-body__human'>
			{renderInfo && renderInfo()}
			{!isBeautified && '{'}
			{fields.map(([key, value], idx, arr) => (
				<React.Fragment key={key}>
					<MessageBodyCardField
						primarySort={sortOrderItems}
						highlightColor={isSelected ? SELECTED_HIGHLIGHT_COLOR : DEFAULT_HIGHLIGHT_COLOR}
						label={key}
						field={value}
						isBeautified={isBeautified}
						isHighlighted={areSiblingsHighlighed}
						setIsHighlighted={highlightSiblings}
					/>
					{isBeautified || idx === arr.length - 1 ? null : ', '}
				</React.Fragment>
			))}
			{!isBeautified && '}'}
		</pre>
	);
}

interface FieldProps {
	isBeautified: boolean;
	label: string;
	field: MessageBodyField;
	isHighlighted?: boolean;
	setIsHighlighted: (isHighlighted: boolean) => void;
	isRoot?: boolean;
	highlightColor: string;
	primarySort: string[];
	renderInfo?: () => React.ReactNode;
}

function MessageBodyCardField(props: FieldProps) {
	const {
		primarySort,
		field,
		label,
		isBeautified,
		isHighlighted = false,
		isRoot = true,
		setIsHighlighted,
		highlightColor,
	} = props;

	const [areSiblingsHighlighed, highlightSiblings] = React.useState(false);

	if (isRoot) {
		return (
			<MessageBodyCardField
				primarySort={primarySort}
				highlightColor={highlightColor}
				isBeautified={isBeautified}
				field={field}
				label={label}
				isRoot={false}
				isHighlighted={isHighlighted}
				setIsHighlighted={setIsHighlighted}
			/>
		);
	}

	const subFields = isMessageValue(field)
		? field.messageValue && field.messageValue.fields
			? field.messageValue.fields
			: {}
		: {};

	const sortedSubFields = getSortedFields(subFields, primarySort);

	return (
		<span
			className='mc-body__field'
			style={{
				display: isBeautified ? 'block' : undefined,
				background: isHighlighted ? backgroundGradient`${highlightColor}` : undefined,
			}}>
			<span
				onMouseEnter={() => setIsHighlighted(true)}
				onMouseLeave={() => setIsHighlighted(false)}
				className='mc-body__field-label'>
				{label ? (isBeautified ? `${label}: ` : `"${label}": `) : ''}
			</span>
			{isSimpleValue(field) ? (
				<span className='mc-body__field-simple-value'>{field.simpleValue}</span>
			) : isListValue(field) ? (
				<>
					{'['}
					<span
						style={{
							display: isBeautified ? 'block' : undefined,
							paddingLeft: isBeautified ? BEAUTIFIED_PAD_VALUE : undefined,
						}}>
						{field.listValue.values?.map((value, idx) => (
							<MessageBodyCardField
								primarySort={primarySort}
								key={idx}
								field={value}
								label={''}
								isBeautified={isBeautified}
								isHighlighted={isHighlighted}
								isRoot={true}
								setIsHighlighted={highlightSiblings}
								highlightColor={highlightColor}
							/>
						))}
					</span>
					{']'}
				</>
			) : (
				<>
					{'{'}
					<span
						style={{
							display: isBeautified ? 'block' : undefined,
							paddingLeft: isBeautified ? BEAUTIFIED_PAD_VALUE : undefined,
						}}>
						{sortedSubFields.map(([key, subField], idx, arr) => (
							<React.Fragment key={key}>
								<MessageBodyCardField
									primarySort={primarySort}
									field={subField}
									label={key}
									isBeautified={isBeautified}
									isHighlighted={areSiblingsHighlighed}
									isRoot={false}
									setIsHighlighted={highlightSiblings}
									highlightColor={highlightColor}
								/>
								{isBeautified || idx === arr.length - 1 ? null : ', '}
							</React.Fragment>
						))}
					</span>
					{'}'}
				</>
			)}
		</span>
	);
}

export default observer(MessageBodyCard);

export function MessageBodyCardFallback({ body, isBeautified }: Props) {
	return (
		<pre className='mc-body__human'>
			{isBeautified ? JSON.stringify(body, undefined, '  ') : JSON.stringify(body)}
		</pre>
	);
}

const backgroundGradient = (strings: TemplateStringsArray, color: string) =>
	`linear-gradient(to bottom, 
        transparent 0%,
        transparent 2px,
        ${color} 2px,
        ${color} calc(100% - 2px),
        transparent calc(100% - 2px),
        transparent 100%
	)`;

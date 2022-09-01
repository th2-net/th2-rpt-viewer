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
import debounce from 'lodash.debounce';
import { createBemElement } from '../../../helpers/styleCreators';
import MessageBody, {
	isSimpleValue,
	MessageBodyField,
	isListValue,
	MessageBodyFields,
	isMessageValue,
	isNullValue,
} from '../../../models/MessageBody';

const BEAUTIFIED_PAD_VALUE = 15;
const DEFAULT_HIGHLIGHT_COLOR = '#e2dfdf';
const SELECTED_HIGHLIGHT_COLOR = '#fff';

interface Props {
	isBeautified: boolean;
	body: MessageBody | null;
	isSelected: boolean;
	sortOrderItems: string[];
}

const getSortedFields = (fields: MessageBodyFields, sortOrder: string[]) => {
	const primarySortedFields: [string, MessageBodyField][] = Object.entries(
		sortOrder.reduce((prev, curr) => (fields[curr] ? { ...prev, [curr]: fields[curr] } : prev), {}),
	);

	const secondarySortedFields: [string, MessageBodyField][] = Object.entries(fields)
		.filter(([key]) => key.includes('-') && !sortOrder.includes(key))
		.sort((a: [string, MessageBodyField], b: [string, MessageBodyField]) => {
			const [keyA] = a;
			const [keyB] = b;
			return +keyA.charAt(keyA.length - 1) > +keyB.charAt(keyB.length - 1) ? 1 : -1;
		});

	const secondarySortedKeys = secondarySortedFields.map(([key]) => key);

	const tertiarySortedFields: [string, MessageBodyField][] = Object.entries(fields)
		.filter(([key]) => !sortOrder.includes(key) && !secondarySortedKeys.includes(key))
		.sort((a: [string, MessageBodyField], b: [string, MessageBodyField]) => {
			const [keyA] = a;
			const [keyB] = b;
			return keyA.toLowerCase() > keyB.toLowerCase() ? 1 : -1;
		});

	return [...primarySortedFields, ...secondarySortedFields, ...tertiarySortedFields];
};

function MessageBodyCard({ isBeautified, body, isSelected, sortOrderItems }: Props) {
	const [areSameContext, highlightSameContext] = React.useState(false);

	const fields = React.useMemo(
		() => getSortedFields(body?.fields ? body.fields : {}, sortOrderItems),
		[body, sortOrderItems],
	);

	if (body == null) {
		return <pre className='mc-body__human'>null</pre>;
	}

	return (
		<pre className='mc-body__human' style={{ display: isBeautified ? 'block' : 'inline' }}>
			{!isBeautified && (
				<span
					className={createBemElement('mc-body', 'field-border', areSameContext ? 'active' : null)}>
					{'{'}
				</span>
			)}
			{fields.map(([key, value], idx, arr) => (
				<React.Fragment key={key}>
					<MessageBodyCardField
						primarySort={sortOrderItems}
						highlightColor={isSelected ? SELECTED_HIGHLIGHT_COLOR : DEFAULT_HIGHLIGHT_COLOR}
						label={key}
						field={value}
						isBeautified={isBeautified}
						setIsHighlighted={highlightSameContext}
					/>
					{isBeautified || idx === arr.length - 1 ? null : ', '}
				</React.Fragment>
			))}
			{!isBeautified && (
				<span
					className={createBemElement('mc-body', 'field-border', areSameContext ? 'active' : null)}>
					{'}'}
				</span>
			)}
		</pre>
	);
}

interface FieldProps {
	isBeautified: boolean;
	label: string;
	field: MessageBodyField;
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
		isRoot = true,
		setIsHighlighted,
		highlightColor,
	} = props;

	const [areSameContext, highlightSameContext] = React.useState(false);

	const highlight = React.useMemo(() => {
		return debounce(() => setIsHighlighted(true), 60);
	}, []);

	const removeHighlight = React.useCallback(() => {
		highlight.cancel();
		setIsHighlighted(false);
	}, [highlight]);

	if (isRoot) {
		return (
			<MessageBodyCardField
				primarySort={primarySort}
				highlightColor={highlightColor}
				isBeautified={isBeautified}
				field={field}
				label={label}
				isRoot={false}
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
			}}>
			<span
				onMouseEnter={highlight}
				onMouseLeave={removeHighlight}
				className='mc-body__field-label'>
				{label ? `${label}: ` : ''}
			</span>
			{isNullValue(field) ? (
				<span
					onMouseEnter={highlight}
					onMouseLeave={removeHighlight}
					className='mc-body__field-simple-value null'>
					{null}
				</span>
			) : isSimpleValue(field) ? (
				<span
					onMouseEnter={highlight}
					onMouseLeave={removeHighlight}
					className='mc-body__field-simple-value'>
					{field.simpleValue}
				</span>
			) : isListValue(field) ? (
				<>
					<span
						className={createBemElement(
							'mc-body',
							'field-border',
							areSameContext ? 'active' : null,
						)}>
						{'['}
					</span>
					<span
						style={{
							display: isBeautified ? 'block' : undefined,
							paddingLeft: isBeautified ? BEAUTIFIED_PAD_VALUE : undefined,
						}}>
						{field.listValue.values?.map((value, idx, arr) => (
							<React.Fragment key={idx}>
								<MessageBodyCardField
									primarySort={primarySort}
									key={idx}
									field={value}
									label={''}
									isBeautified={isBeautified}
									isRoot={true}
									setIsHighlighted={highlightSameContext}
									highlightColor={highlightColor}
								/>
								{isBeautified || idx === arr.length - 1 ? null : ', '}
							</React.Fragment>
						))}
					</span>
					<span
						className={createBemElement(
							'mc-body',
							'field-border',
							areSameContext ? 'active' : null,
						)}>
						{']'}
					</span>
				</>
			) : (
				<>
					<span
						className={createBemElement(
							'mc-body',
							'field-border',
							areSameContext ? 'active' : null,
						)}>
						{'{'}
					</span>
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
									isRoot={false}
									setIsHighlighted={highlightSameContext}
									highlightColor={highlightColor}
								/>
								{isBeautified || idx === arr.length - 1 ? null : ', '}
							</React.Fragment>
						))}
					</span>
					<span
						className={createBemElement(
							'mc-body',
							'field-border',
							areSameContext ? 'active' : null,
						)}>
						{'}'}
					</span>
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

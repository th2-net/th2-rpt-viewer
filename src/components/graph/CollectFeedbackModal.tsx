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

import React, { useEffect, useState } from 'react';
import { useErrorsStore, useResponsesStore, useScreenshot } from '../../hooks';
import StringFilterRow from '../filter/row/StringRow';

interface CollectFeedbackModalProps {
	toggleModal: () => void;
	isOpen: boolean;
}

const CollectFeedbackModal = ({ toggleModal, isOpen }: CollectFeedbackModalProps) => {
	const { image, takeScreenshot, clear } = useScreenshot();
	const { errors } = useErrorsStore();
	const [title, setTitle] = useState('');
	const [descr, setDescr] = useState('');

	useEffect(() => {
		if (!isOpen) clear();
	}, [isOpen]);

	return (
		<div className='collect-feedback-modal'>
			<h3 className='collect-feedback-modal__header'>Report a problem</h3>
			<StringFilterRow
				config={{ type: 'string', value: title, setValue: setTitle, id: 'title', label: 'Title:' }}
			/>
			<StringFilterRow
				config={{
					type: 'string',
					textarea: true,
					value: descr,
					setValue: setDescr,
					id: 'title',
					label: 'Description:',
				}}
			/>
			<div className='collect-feedback-modal__info'>
				{errors.length > 0 && (
					<div className='collect-feedback-modal__errors'>
						<h4>Last errors:</h4>
						{errors.map((error, i) => (
							<p key={`${error.message}_${i}`} className='collect-feedback-modal__error'>
								{error.message}
							</p>
						))}
					</div>
				)}
			</div>
			{image && (
				<div className='collect-feedback-modal__screenshot'>
					Screenshot:
					<img src={image} alt='screenshot' />
				</div>
			)}
			<div className='collect-feedback-modal__buttons'>
				{!image ? (
					<button
						className='collect-feedback-modal__button'
						onClick={() => {
							toggleModal();
							takeScreenshot().finally(toggleModal);
						}}>
						Include Screenshot
					</button>
				) : (
					<button className='collect-feedback-modal__button' onClick={clear}>
						Clear Screenshot
					</button>
				)}
				<button className='collect-feedback-modal__button'>Ok</button>
			</div>
		</div>
	);
};

export default CollectFeedbackModal;

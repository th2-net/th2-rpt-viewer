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

import { observer } from 'mobx-react-lite';
import React, { useRef } from 'react';
import { useFeedbackStore, useOutsideClickListener } from '../hooks';
import { FeedbackFields } from '../stores/FeedbackStore';
import { ModalPortal } from './util/Portal';
import StringFilterRow from './filter/row/StringRow';
import '../styles/collect-feedback.scss';

const CollectFeedback = () => {
	const {
		isLoading,
		errors,
		isOpen,
		inputs: { title, descr, image },
		toggleOpen,
		takeScreenshot,
		clearScreenshot,
		setInputValues,
		sendFeedback,
	} = useFeedbackStore();
	const modalRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		if (e.target !== buttonRef.current) {
			toggleOpen(false);
		}
	});

	return (
		<>
			<button
				ref={buttonRef}
				onClick={() => {
					toggleOpen();
				}}
				className='collect-feedback-button'>
				collect feedback
			</button>
			<ModalPortal
				isOpen={isOpen}
				ref={modalRef}
				style={{
					position: 'absolute',
					top: '35px',
					left: '90px',
					zIndex: 500,
				}}>
				<div className='collect-feedback-modal'>
					<h3 className='collect-feedback-modal__header'>Report a problem</h3>
					<StringFilterRow
						config={{
							type: 'string',
							value: title,
							setValue: v => setInputValues(FeedbackFields.TITLE, v),
							id: FeedbackFields.TITLE,
							label: 'Title:',
						}}
					/>
					<StringFilterRow
						config={{
							type: 'string',
							textarea: true,
							value: descr,
							setValue: v => setInputValues(FeedbackFields.DESCR, v),
							id: FeedbackFields.DESCR,
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
									toggleOpen();
									takeScreenshot().finally(toggleOpen);
								}}>
								Include Screenshot
							</button>
						) : (
							<button className='collect-feedback-modal__button' onClick={() => clearScreenshot()}>
								Clear Screenshot
							</button>
						)}
						<button className='collect-feedback-modal__button' onClick={sendFeedback}>
							{isLoading ? <span className='spinner'></span> : 'Ok'}
						</button>
					</div>
				</div>
			</ModalPortal>
		</>
	);
};

export default observer(CollectFeedback);

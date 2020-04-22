/** ****************************************************************************
* Copyright 2009-2019 Exactpro (Exactpro Systems Limited)
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
import { TestCaseMetadata, isTestCaseMetadata } from '../models/TestcaseMetadata';
import { formatTime, getSecondsPeriod } from '../helpers/date';
import { createStyleSelector, createBemElement } from '../helpers/styleCreators';
import { KnownBugIndicator } from './knownbugs/KnownBugIndicator';
import { KnownBugSummary } from './knownbugs/KnownBugSummary';
import LiveTimer from './LiveTimer';
import '../styles/report.scss';

interface Props {
    metadata: TestCaseMetadata;
    knownBugsEnabled: boolean;
    index: number;
    isSelected: boolean;
	isMLSubmitted: boolean;
	loadTestCase: (jsonpFilename: string) => void;
}

const TestCaseCard = ({
	metadata, index, knownBugsEnabled, isSelected, isMLSubmitted, loadTestCase,
}: Props) => {
	const baseRef = React.useRef<HTMLDivElement>(null);

	let isLive: boolean;
	let elapsedTime: string;
	let status: string;

	if (isTestCaseMetadata(metadata)) {
		isLive = false;
		elapsedTime = getSecondsPeriod(metadata.startTime, metadata.finishTime!);
		status = metadata.status.status.toUpperCase();
	} else {
		isLive = true;
		elapsedTime = '';
		status = 'RUNNING';
	}

	React.useEffect(() => {
		if (isSelected) {
			baseRef.current?.scrollIntoView();
		}
	}, [isSelected]);

	const rootClass = createStyleSelector(
		'tc-card',
		status,
		isSelected ? 'selected' : null,
	); const
		mlSubmittedBoxClass = createBemElement('tc-card',
			'ml-submitted',
			isMLSubmitted ? null : 'hidden');

	return (
		<div className={rootClass} ref={baseRef} onClick={() => loadTestCase(metadata.jsonpFileName)}>
			<div className="tc-card__index">{index}</div>
			<div className="tc-card__title">
				<div className="tc-card__name">
					{
						isLive
							? <div className="tc-card__live-loader"/>
							: null
					}
					{metadata.name}
				</div>
				{
					metadata.description
						? <div className="tc-card__description"> — {metadata.description}</div>
						: null
				}
			</div>
			<div className={mlSubmittedBoxClass}>
				<div className="tc-card__ml-submitted icon"/>
			</div>
			<div className="tc-card__status">
				{status}
			</div>
			<div className="tc-card__info">
				<div className="tc-card__info-element">
					<div className="tc-card__info-title">Start</div>
					<div className="tc-card__info-value">{formatTime(metadata.startTime)}</div>
				</div>
				{
					isTestCaseMetadata(metadata) ? (
						<div className="tc-card__info-element">
							<div className="tc-card__info-title">Finish</div>
							<div className="tc-card__info-value">
								{metadata.finishTime && formatTime(metadata.finishTime)}
							</div>
						</div>
					) : null
				}
				<div className="tc-card__info-element">
					<div className="tc-card__info-title">ID</div>
					<div className="tc-card__info-value">{metadata.id}</div>
				</div>
				<div className="tc-card__info-element">
					<div className="tc-card__info-title">Hash</div>
					<div className="tc-card__info-value">{metadata.hash}</div>
				</div>
			</div>
			<div className="tc-card__elapsed-time">
				{
					isLive
						? <LiveTimer startTime={metadata.startTime}/>
						: elapsedTime
				}
			</div>
			{
				isTestCaseMetadata(metadata) && knownBugsEnabled && metadata.bugs.length > 0 ? (
					<React.Fragment>
						<div className="tc-card__divider"/>
						<KnownBugIndicator data={metadata.bugs}/>
						<KnownBugSummary data={metadata.bugs}/>
					</React.Fragment>
				) : null
			}
		</div>
	);
};

export default TestCaseCard;

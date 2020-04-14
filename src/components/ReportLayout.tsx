/** ****************************************************************************
* Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import { isTestCaseMetadata, TestCaseMetadata } from '../models/TestcaseMetadata';
import { StatusType } from '../models/Status';
import HeatmapScrollbar from './heatmap/HeatmapScrollbar';
import { testCasesHeatmap } from '../helpers/heatmapCreator';
import { createStyleSelector, createBemElement } from '../helpers/styleCreators';
import { ExceptionChain } from './ExceptionChain';
import TestCaseCard from './TestCaseCard';
import { FailedTestCaseCarousel } from './FailedTestCaseCarousel';
import { ToggleButton } from './ToggleButton';
import RunInformation from './RunInformation';
import ReportSummary from './ReportSummary';
import { useStores } from '../hooks/useStores';
import '../styles/report.scss';

const OLD_REPORT_PATH = 'report.html';

// eslint-disable-next-line no-shadow
enum Panel {ReportSummary, RunInfo}


const ReportLayout = observer(() => {
	const { reportStore, mlStore, selectedStore } = useStores();
	const [showKnownBugs, setShowKnownBugs] = React.useState(true);
	const [panel, setPanel] = React.useState(Panel.ReportSummary);

	const report = reportStore.report!;

	const toggleKnownBugs = () => {
		setShowKnownBugs(!showKnownBugs);
	};

	const getPanel = (): React.ReactNode => {
		switch (panel) {
		case Panel.RunInfo:
			return <RunInformation report={report} />;
		case Panel.ReportSummary:
			return <ReportSummary report={report} />;
		default:
			return null;
		}
	};

	const changePanel = (newPanel: Panel) => {
		setPanel(newPanel);
	};

	const isMLSubmitted = (metadata: TestCaseMetadata) => {
		const submittedCount = [...new Set(mlStore.submittedData.map(m => m.actionId))]
			.filter(actionId => actionId >= metadata.firstActionId
                && actionId <= metadata.lastActionId).length;

		return submittedCount === metadata.failedActionCount && submittedCount !== 0;
	};

	const calculateMLStats = () => {
		const uniqueActionId = new Set(mlStore.submittedData.map(m => m.actionId)).size;
		const metadata = reportStore.report?.metadata || [];
		const failedActions = metadata.map(m => m.failedActionCount).reduce((a, b) => a + b, 0);

		return uniqueActionId / failedActions;
	};

	const createChangePanelHandler = (newPanel: Panel) => () => {
		changePanel(newPanel);
	};


	const mlStats = `${(calculateMLStats() * 100).toPrecision(2)}%`;

	const filteredMetadata = report.metadata.filter(isTestCaseMetadata);
	const knownBugsPresent = filteredMetadata.some(
		(item: TestCaseMetadata) => item.bugs != null && item.bugs.length > 0,
	);
	const knownBugsClass = showKnownBugs ? 'active' : 'enabled';
	const failedTestCasesEnabled = filteredMetadata.some(
		({ status }: TestCaseMetadata) => status.status === StatusType.FAILED,
	);
	const failedTcTitleClass = createBemElement('report', 'title', failedTestCasesEnabled ? 'failed' : 'disabled');
	const isLive = report.finishTime == null;
	const mlStatsClass = createStyleSelector('ml-stats', mlStore.token !== null ? null : 'hidden');

	const knownBugsButton = (
		knownBugsPresent
			? (
				<div
					className={`report__known-bugs-button ${knownBugsClass}`}
					onClick={() => toggleKnownBugs()}>
					<div className={`report__known-bugs-button__icon ${knownBugsClass}`} />
					<div className={`report__known-bugs-button__text ${knownBugsClass}`}>Known bugs</div>
				</div>
			) : (
				<div className="report__known-bugs-button disabled">
					<div className="report__known-bugs-button__icon disabled" />
					<div className="report__known-bugs-button__text disabled">No known bugs</div>
				</div>
			)
	);

	return (
		<div className="report">
			<div className="report__header   report-header">
				{
					isLive
						? <div className="report-header__live-loader"
							title="Report executing in progress"/>
						: null
				}
				<div className="report-header__title">{reportStore.report?.name}</div>
				<a className="report-header__old-report-link" href={OLD_REPORT_PATH}>
					<p>Old Version Report</p>
				</a>
			</div>
			<div className="report__summary-title   report__title">
				<p>Report Summary</p>
			</div>
			<div className="report__controls">
				<div className="report__title">Test Cases</div>
				<div className={failedTcTitleClass}>
					{ failedTestCasesEnabled ? 'Failed' : 'No Failed' }
				</div>
				<FailedTestCaseCarousel/>
				{knownBugsButton}
				<div className={mlStatsClass}>
					<span className="ml-stats__title">ML Collected</span>
					<div className="ml-stats__bar">
						<div className="ml-stats__progress-bar" style={{ width: mlStats }}/>
					</div>
					<span className="ml-stats__percents">{mlStats}</span>
				</div>
			</div>
			<div className="report__summary">
				<div className="report-summary">
					<div className="report-summary__card">
						<div className="report-summary__element">
							<div className="report-summary__logo"/>
							<div className="report-summary__vertical_element">
								<div className="report-summary__element-title">Version</div>
								<div className="report-summary__element-value">{report.version}</div>
							</div>
						</div>
						<div className="layout-panel__tabs">
							<ToggleButton
								textClass="report-summary__button_text"
								isToggled={panel === Panel.ReportSummary}
								onClick={createChangePanelHandler(Panel.ReportSummary)}>
									Report Summary
							</ToggleButton>
							<ToggleButton
								textClass="report-summary__button_text"
								isToggled={panel === Panel.RunInfo}
								onClick={createChangePanelHandler(Panel.RunInfo)}>
									Run Information
							</ToggleButton>
						</div>
						{getPanel()}
					</div>
				</div>
			</div>
			<div className="report__testcases">
				{
					report.metadata.length > 0 || report.exception == null ? (
						<HeatmapScrollbar
							selectedElements={testCasesHeatmap(report.metadata)}
							elementsCount={report.metadata.length}>
							{
								report.metadata.map((metadata: TestCaseMetadata, index: number) => (
									<TestCaseCard
										knownBugsEnabled={showKnownBugs}
										isSelected={metadata.id === selectedStore.selectedTestCaseId}
										key={index}
										metadata={metadata}
										index={index + 1}
										isMLSubmitted={isMLSubmitted(metadata)}
										loadTestCase={(jsonPfilename: string) =>
											selectedStore.loadTestCase(jsonPfilename)}/>
								))
							}
						</HeatmapScrollbar>
					) : (
						<ExceptionChain
							exception={report.exception}/>
					)
				}
			</div>
		</div>
	);
});

export default ReportLayout;

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

/* eslint-disable no-restricted-globals */
/* eslint-disable no-new-wrappers */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../hooks/useStores';
import TestCaseLayout from './TestCaseLayout';
import ReportLayout from './ReportLayout';
import {
	getUrlSearchString,
	ACTION_PARAM_KEY,
	MESSAGE_PARAM_KEY,
	TEST_CASE_PARAM_KEY,
} from '../middleware/urlHandler';
import SplashScreen from './SplashScreen';
import '../styles/root.scss';

const REPORT_FILE_PATH = 'index.html';

const App = observer(() => {
	const {
		reportStore,
		selectedStore,
		mlStore,
		viewStore,
	} = useStores();
	const searchParams = React.useRef<URLSearchParams | null>(null);

	React.useEffect(() => {
		reportStore.loadReport();
		validateUrl();
	}, []);

	React.useEffect(() => {
		// We can't use componentDidMount for this, because report file not yet loaded.
		// Only first funciton call will use it.
		if (!searchParams.current) {
			searchParams.current = new URLSearchParams(getUrlSearchString(window.location.href));
			handleSharedUrl();
		}

		if (reportStore.report !== null) {
			document.title = reportStore.report.name;

			// init ML features
			if (!mlStore.token && reportStore.report.reportProperties) {
				// this.props.fetchToken();
			}
		}
	}, [reportStore.report, mlStore.token]);


	const handleSharedUrl = () => {
		if (!searchParams.current) return;
		const testCaseOrder = searchParams.current.get(TEST_CASE_PARAM_KEY);
		const actionId = searchParams.current.get(ACTION_PARAM_KEY);
		const msgId = searchParams.current.get(MESSAGE_PARAM_KEY);

		if (testCaseOrder != null) {
			selectTestCaseByOrder(Number.parseInt(testCaseOrder));
		}

		if (msgId !== null && !isNaN(Number(msgId))) {
			selectedStore.selectVerification(Number(msgId));
		}

		if (actionId !== null && !isNaN(Number(actionId))) {
			selectedStore.selectActionById(Number(actionId));
		}
	};

	/**
	 * This function replaces url file path to index.html when we go to the new report from the old
	 */
	const validateUrl = () => {
		const { href } = window.location;
		const filePath = href.slice(href.lastIndexOf('/'));

		if (!filePath.includes(REPORT_FILE_PATH)) {
			window.history.pushState({}, '', href.replace(filePath, `/${REPORT_FILE_PATH}`));
		}
	};

	const selectTestCaseByOrder = (testCaseOrder: number) => {
		if (!reportStore.report) {
			console.error('Trying to handle shared url before report load.');
			return;
		}

		const testCaseMetadata = reportStore.report.metadata.find(metadata => metadata.order === testCaseOrder);

		if (testCaseMetadata) {
			// this.props.loadTestCase(testCaseMetadata);
		} else {
			console.warn("Can't handle shared url: Test Case with this id not found");
		}
	};


	if (viewStore.isLoading) {
		return (
			<div className="root">
				<SplashScreen />
			</div>
		);
	}

	if (selectedStore.testCase) {
		return (
			<div className="root">
				<TestCaseLayout />
			</div>
		);
	}

	return (
		<div className="root">
			<ReportLayout/>
		</div>
	);
});

export default App;

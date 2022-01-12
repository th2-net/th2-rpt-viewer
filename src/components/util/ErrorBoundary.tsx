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

import * as React from 'react';
import ErrorScreen from '../ErrorScreen';

interface Props {
	errorMessage?: string;
	fallback?: React.ReactElement;
}

interface State {
	hasError: boolean;
	error: Error;
	errorInfo?: React.ErrorInfo;
}

export default class ErrorBoundary extends React.Component<Props, State> {
	state = {
		hasError: false,
		error: new Error(),
		errorInfo: undefined,
	};

	static getDerivedStateFromError(error: Error, errorInfo: React.ErrorInfo): State {
		return {
			hasError: true,
			error,
			errorInfo,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error(`${error.stack}, component stack: ${errorInfo.componentStack}`);
		this.setState({ error, errorInfo });
	}

	render() {
		const { hasError } = this.state;
		const { fallback } = this.props;
		if (hasError) {
			if (React.isValidElement(fallback)) {
				return fallback;
			}
			return <ErrorScreen error={this.state.error} errorInfo={this.state.errorInfo} />;
		}

		return this.props.children;
	}
}

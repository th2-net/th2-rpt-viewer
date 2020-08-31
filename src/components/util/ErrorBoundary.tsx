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

interface Props {
    errorMessage?: string;
	fallback?: React.ReactElement;
}

interface State {
	hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
	state = {
		hasError: false,
	};

	static getDerivedStateFromError(): State {
		return {
			hasError: true,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error(`${error.stack}, component stack: ${errorInfo.componentStack}`);
	}

	render() {
		const errorMessage = this.props.errorMessage || 'Something went wrong...';
		const { hasError } = this.state;
		const { fallback } = this.props;
		if (hasError) {
			if (React.isValidElement(fallback)) {
				return fallback;
			}
			return errorMessage;
		}

		return this.props.children;
	}
}

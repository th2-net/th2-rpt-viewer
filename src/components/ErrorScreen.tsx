import * as React from 'react';
import '../styles/error.scss';

interface Props {
	error: Error;
	errorInfo?: React.ErrorInfo;
}

const ErrorScreen = (props: Props) => {
	const { error, errorInfo } = props;

	return (
		<div className='error-screen'>
			{`${error}`}
			<details style={{ whiteSpace: 'pre-wrap' }}>{`${errorInfo?.componentStack}`}</details>
		</div>
	);
};

export default ErrorScreen;

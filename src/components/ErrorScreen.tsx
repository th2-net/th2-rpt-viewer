import * as React from 'react';
import '../styles/error.scss';
import api from '../api/index';

interface Props {
	error: Error;
	errorInfo?: React.ErrorInfo;
}

const ErrorScreen = (props: Props) => {
	const { error, errorInfo } = props;

	const clearData = async () => {
		await api.indexedDb.clearAllData();
		window.location.reload();
	};

	return (
		<div className='error-screen'>
			{`${error}`}
			{error.message.includes('newer than') && error.message.includes('clear cache') && (
				<button onClick={clearData}> Clear Data </button>
			)}
			<details style={{ whiteSpace: 'pre-wrap' }}>{`${errorInfo?.componentStack}`}</details>
		</div>
	);
};

export default ErrorScreen;

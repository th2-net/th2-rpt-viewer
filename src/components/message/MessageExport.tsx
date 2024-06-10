import React from 'react';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageViewType, MessagesOrderForExport } from '../../models/EventMessage';

interface Props {
	isExport: boolean;
	enableExport: () => void;
	disableExport: () => void;
	endExport: (messageViewType: MessageViewType) => void;
	exportAmount: number;
	selectAll: () => void;
	setExportOrder: (order: MessagesOrderForExport) => void;
	currentExportOrder: MessagesOrderForExport;
}

const MessageExport = (props: Props) => {
	const {
		isExport,
		enableExport,
		disableExport,
		endExport,
		exportAmount,
		selectAll,
		setExportOrder,
	} = props;
	const [isOpenFormatParam, setIsOpenFormatParam] = React.useState(false);
	const [isOpenOrderParam, setIsOpenOrderParam] = React.useState(false);

	const toggleOrderParam = () => {
		setIsOpenOrderParam(!isOpenOrderParam);
		if (isOpenFormatParam) setIsOpenFormatParam(false);
	};

	const toggleFormatParam = () => {
		setIsOpenFormatParam(!isOpenFormatParam);
		if (isOpenOrderParam) setIsOpenOrderParam(false);
	};

	const handleSetExportOrder = (order: MessagesOrderForExport) => {
		setIsOpenOrderParam(false);
		setExportOrder(order);
	};

	const exportMessages = (messageViewType: MessageViewType) => {
		setIsOpenFormatParam(false);
		endExport(messageViewType);
	};

	const closeExport = () => {
		disableExport();
		setIsOpenFormatParam(false);
		setIsOpenOrderParam(false);
	};

	return (
		<>
			{isExport ? (
				<>
					<span className='messages-window-header__export-counter'> {exportAmount} </span>
					<div className='messages-window-header__export'>
						<button className='messages-window-header__export-btn' onClick={selectAll}>
							<span className='messages-window-header__export-text'>Select All</span>
						</button>
						<button className='messages-window-header__export-btn' onClick={toggleOrderParam}>
							<i className='messages-window-header__export-params' />
						</button>
						<button className='messages-window-header__export-btn' onClick={toggleFormatParam}>
							<i className='messages-window-header__export-end' />
						</button>
						<AnimatePresence>
							{isOpenFormatParam && (
								<motion.div
									className='messages-window-header__export-controls'
									style={{ transformOrigin: 'top' }}
									initial={{ opacity: 0, scale: 0.5 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.5 }}
									transition={{ duration: 0.15, ease: 'easeOut' }}>
									<button
										className='messages-window-header__export-tool'
										title='Export to JSON'
										onClick={() => exportMessages(MessageViewType.JSON)}>
										<i className='messages-window-header__export-json' />
									</button>
									<button
										className='messages-window-header__export-tool'
										title='Export to formatted JSON'
										onClick={() => exportMessages(MessageViewType.FORMATTED)}>
										<i className='messages-window-header__export-formatted' />
									</button>
									<button
										className='messages-window-header__export-tool'
										title='Export to binary'
										onClick={() => exportMessages(MessageViewType.BINARY)}>
										<i className='messages-window-header__export-binary' />
									</button>
									<button
										className='messages-window-header__export-tool'
										title='Export to ASCII'
										onClick={() => exportMessages(MessageViewType.ASCII)}>
										<i className='messages-window-header__export-ascii' />
									</button>
								</motion.div>
							)}
						</AnimatePresence>
						<AnimatePresence>
							{isOpenOrderParam && (
								<motion.div
									className='messages-window-header__export-controls'
									style={{ transformOrigin: 'top' }}
									initial={{ opacity: 0, scale: 0.5 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.5 }}
									transition={{ duration: 0.15, ease: 'easeOut' }}>
									<button
										className='messages-window-header__export-tool'
										title='Export Latest First (Default)'
										onClick={() => handleSetExportOrder(MessagesOrderForExport.DEFAULT)}>
										{`Desc - As UI ${
											props.currentExportOrder === MessagesOrderForExport.DEFAULT ? '(current)' : ''
										}`}
									</button>
									<button
										className='messages-window-header__export-tool'
										title='Export Oldest First (Chronologically)'
										onClick={() => handleSetExportOrder(MessagesOrderForExport.CHRONOLOGICALLY)}>
										{`Asc - Chronologically ${
											props.currentExportOrder === MessagesOrderForExport.CHRONOLOGICALLY
												? '(current)'
												: ''
										}`}
									</button>
								</motion.div>
							)}
						</AnimatePresence>
						<button className='messages-window-header__export-btn' onClick={closeExport}>
							<i className='messages-window-header__export-disable' />
						</button>
					</div>
				</>
			) : (
				<button className='messages-window-header__export-btn' onClick={enableExport}>
					<i className='messages-window-header__export-enable' />
				</button>
			)}
		</>
	);
};

export default observer(MessageExport);

import React from 'react';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageViewType } from '../../models/EventMessage';

interface Props {
	isExport: boolean;
	enableExport: () => void;
	disableExport: () => void;
	endExport: (messageViewType: MessageViewType) => void;
	exportAmount: number;
}

const MessageExport = (props: Props) => {
	const { isExport, enableExport, disableExport, endExport, exportAmount } = props;
	const [isOpen, setIsOpen] = React.useState(false);

	const exportMessages = (messageViewType: MessageViewType) => {
		setIsOpen(false);
		endExport(messageViewType);
	};

	const closeExport = () => {
		disableExport();
		setIsOpen(false);
	};

	return (
		<>
			{isExport ? (
				<>
					<span className='messages-window-header__export-counter'> {exportAmount} </span>
					<div className='messages-window-header__export'>
						<button
							className='messages-window-header__export-btn'
							onClick={() => setIsOpen(!isOpen)}>
							<i className='messages-window-header__export-end' />
						</button>
						<AnimatePresence>
							{isOpen && (
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

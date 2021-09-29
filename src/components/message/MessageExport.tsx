import React from 'react';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageViewType } from '../../models/EventMessage';

interface Props {
	isExport: boolean;
	enableExport: () => void;
	disableExport: () => void;
	endExport: (messageViewType: MessageViewType) => void;
}

const MessageExport = (props: Props) => {
	const { isExport, enableExport, disableExport, endExport } = props;
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
		<div>
			{isExport ? (
				<div>
					<button className='messages-window-header__export-btn' onClick={() => setIsOpen(!isOpen)}>
						<i className='messages-window-header__export-end-icon' />
					</button>
					<AnimatePresence>
						{isOpen && (
							<motion.div
								className='message-card-tools__controls'
								style={{ transformOrigin: 'top' }}
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.5 }}
								transition={{ duration: 0.15, ease: 'easeOut' }}>
								<button
									className='messages-window-header__export-tool'
									onClick={() => exportMessages(MessageViewType.JSON)}>
									<i className='message-card-tools__icon json' />
								</button>
								<button
									className='messages-window-header__export-tool'
									onClick={() => exportMessages(MessageViewType.FORMATTED)}>
									<i className='message-card-tools__icon formatted' />
								</button>
								<button
									className='messages-window-header__export-tool'
									onClick={() => exportMessages(MessageViewType.BINARY)}>
									<i className='message-card-tools__icon binary' />
								</button>
								<button
									className='messages-window-header__export-tool'
									onClick={() => exportMessages(MessageViewType.ASCII)}>
									<i className='message-card-tools__icon ascii' />
								</button>
							</motion.div>
						)}
					</AnimatePresence>
					<button className='messages-window-header__export-btn' onClick={closeExport}>
						<i className='messages-window-header__export-disable-icon' />
					</button>
				</div>
			) : (
				<button className='messages-window-header__export-btn' onClick={enableExport}>
					<i className='messages-window-header__export-enable-icon' />
				</button>
			)}
		</div>
	);
};

export default observer(MessageExport);

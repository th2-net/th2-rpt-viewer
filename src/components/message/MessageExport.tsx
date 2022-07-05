import React from 'react';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageViewType } from '../../models/EventMessage';

interface Props {
	isExporting: boolean;
	enableExport: () => void;
	disableExport: () => void;
	endExport: (messageViewType: MessageViewType) => void;
	exportAmount: number;
}

const viewTypes = Object.values(MessageViewType);

const MessageExport = (props: Props) => {
	const { isExporting, enableExport, disableExport, endExport, exportAmount } = props;
	const [isOpen, setIsOpen] = React.useState(false);

	const exportMessages = (messageViewType: MessageViewType) => {
		setIsOpen(false);
		endExport(messageViewType);
	};

	const closeExport = () => {
		disableExport();
		setIsOpen(false);
	};

	if (!isExporting) {
		return (
			<button className='messages-window-header__export-btn' onClick={enableExport}>
				<i className='messages-window-header__export-enable' />
			</button>
		);
	}

	return (
		<>
			<span className='messages-window-header__export-counter'>{exportAmount}</span>
			<div className='messages-window-header__export'>
				<button className='messages-window-header__export-btn' onClick={() => setIsOpen(!isOpen)}>
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
							{viewTypes.map(type => (
								<button
									key={type}
									className='messages-window-header__export-tool'
									title={`Export to ${type}`}
									onClick={() => exportMessages(type)}>
									<i className={`messages-window-header__export-${type.toLowerCase()}`} />
								</button>
							))}
						</motion.div>
					)}
				</AnimatePresence>
				<button className='messages-window-header__export-btn' onClick={closeExport}>
					<i className='messages-window-header__export-disable' />
				</button>
			</div>
		</>
	);
};

export default observer(MessageExport);

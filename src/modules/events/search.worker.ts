import { EventTreeNode } from '../../models/EventAction';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.onmessage = e => {
	const { rawResults, nodes, currentEventId } = e.data;

	const results = nodes
		.filter((node: EventTreeNode) => rawResults.includes(node.eventId))
		.map((node: EventTreeNode) => node.eventId);

	const currentIndex = currentEventId ? results.indexOf(currentEventId) : null;

	postMessage({ results, currentIndex });
};

export default null as any;

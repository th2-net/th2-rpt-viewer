onmessage = e => {
	const { rawResults, nodes } = e.data;

	const results = nodes
		.filter(node => rawResults.includes(node.eventId))
		.map(event => event.eventId);

	const currentIndex = this.currentEventId ? results.indexOf(this.currentEventId) : null;

	postMessage({ results, currentIndex });
};

import SearchToken from '../../models/search/SearchToken';

export const getKeyValueTokens = (tokens: SearchToken[], includeColon = false) => {
	const tokenPairs: { isOne: boolean; keyToken: SearchToken; valueToken: SearchToken }[] = [];

	tokens.forEach(token => {
		const isKeyValue = token.pattern.indexOf(':');
		if (isKeyValue > -1) {
			const patternKey = token.pattern.slice(0, isKeyValue + Number(includeColon));
			const patternValue = token.pattern.slice(isKeyValue + 1).trim();
			tokenPairs.push({
				isOne: true,
				keyToken: { ...token, pattern: patternKey },
				valueToken: { ...token, pattern: patternValue },
			});
		} else {
			tokenPairs.push({
				isOne: false,
				keyToken: { ...token, pattern: token.pattern },
				valueToken: { ...token, pattern: token.pattern },
			});
		}
	});
	return tokenPairs;
};

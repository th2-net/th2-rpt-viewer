/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

/* eslint-disable no-param-reassign */
/**
 * A function to lighten HEX color.
 * @param color HEX color
 * @param amount amount color to be lighten
 */
export const lighten = (color: string, amount: number) => {
	// eslint-disable-next-line no-shadow
	const addLight = (color: string, amount: number) => {
		const cc = parseInt(color, 16) + amount;
		const c = (cc > 255) ? 255 : (cc);
		return (c.toString(16).length > 1) ? c.toString(16) : `0${c.toString(16)}`;
	};

	color = (color.indexOf('#') >= 0) ? color.substring(1, color.length) : color;
	amount = Math.floor((255 * amount) / 100);
	return [
		'#',
		addLight(color.substring(0, 2), amount),
		addLight(color.substring(2, 4), amount),
		addLight(color.substring(4, 6), amount),
	].join('');
};

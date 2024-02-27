/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

export function randomHighlightColor(alpha = 0.5): string {
	const r = Math.floor(Math.random() * 150 + 50);
	const g = Math.floor(Math.random() * 150 + 50);
	const b = Math.floor(Math.random() * 150 + 50);
	return `rgba(${r},${g},${b},${alpha})`;
}

export class HighlightColorManager {
	private predefinedColors: string[] = [
		'rgba(255, 0, 0, 0.5)',
		'rgba(0, 255, 0, 0.5)',
		'rgba(0, 255, 255, 0.5)',
		'rgba(255, 255, 0, 0.5)',
		'rgba(255, 0, 255, 0.5)',
	];

	private colorMap: Map<string, string> = new Map();

	public getHighlightColor(value: string): string {
		const color = this.colorMap.get(value);
		if (color) {
			return color;
		}

		const newColor = this.predefinedColors.pop() || randomHighlightColor();

		this.colorMap.set(value, newColor);
		return newColor;
	}
}

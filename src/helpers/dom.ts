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

export function isElementInViewport(el: HTMLElement) {
	const rect = el.getBoundingClientRect();

	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

export function isDivElement(el: Element): el is HTMLDivElement {
	return el instanceof HTMLDivElement;
}

export function isClickEventInElement(event: MouseEvent, element: HTMLElement) {
	const rect = element.getBoundingClientRect();
	const x = event.clientX;
	if (x < rect.left || x >= rect.right) return false;
	const y = event.clientY;
	if (y < rect.top || y >= rect.bottom) return false;
	return true;
}

export function getElementsFullWidth(el: HTMLElement) {
	const style = window.getComputedStyle(el);
	const width = el.clientWidth;
	const margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
	const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
	const border = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);

	return width + margin - padding + border;
}

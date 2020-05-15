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

import Action from '../../models/Action';

import { generateActionsMap } from '../../helpers/mapGenerator';
import { createAction } from '../util/creators';

describe('[Helpers] Actions map generator', () => {
	test('mapGenerator() with flat actions list', () => {
		const firstAction = createAction(1);
		const secondAction = createAction(2);
		const actions: Action[] = [firstAction, secondAction];

		const resultActionsMap = generateActionsMap(actions);

		const expectedActionsMap = new Map<number, Action>([[1, firstAction], [2, secondAction]]);

		expect(resultActionsMap).toEqual(expectedActionsMap);
	});

	test('mapGenerator() with actions tree ', () => {
		const firstAction = createAction(1);
		const fourthAction = createAction(4);
		const thirdAction = createAction(3, [fourthAction]);
		const secondAction = createAction(2, [thirdAction]);
		const actions = [firstAction, secondAction];

		const resultActionsMap = generateActionsMap(actions);

		const expectedActionsMap = new Map<number, Action>([
			[1, firstAction],
			[2, secondAction],
			[3, thirdAction],
			[4, fourthAction],
		]);

		expect(resultActionsMap).toEqual(expectedActionsMap);
	});
});

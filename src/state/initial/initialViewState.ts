/** ****************************************************************************
 * Copyright 2009-2019 Exactpro (Exactpro Systems Limited)
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

import Panel from '../../util/Panel';
import ViewState from '../models/ViewState';
import PanelArea from '../../util/PanelArea';

const initialViewState: ViewState = {
	isLoading: true,
	// eslint-disable-next-line no-new-wrappers
	adminMessagesEnabled: new Boolean(false),
	beautifiedMessages: [],
	leftPanel: Panel.ACTIONS,
	rightPanel: Panel.MESSAGES,
	panelArea: PanelArea.P50,
	isConnectionError: false,
};

export default initialViewState;

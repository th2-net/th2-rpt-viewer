/*******************************************************************************
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
 ******************************************************************************/

import React from "react";
import useAsyncEffect from "../hooks/useAsyncEffect";
import StoresContext, { createStores, RootStoreContext } from "../contexts/storesContext";
import SplashScreen from "./SplashScreen";

function StoresProvider({ children }: React.PropsWithChildren<{}>) {
    const [stores, setStores] = React.useState<RootStoreContext | null>(null);

    useAsyncEffect(async () => {
        const { default: api } = process.env.API_ENV == 'http' ? (
            await import(/* webpackChunkName: "http-api" */ '../api/http')
        ) : (
            await import(/* webpackChunkName: "jsonp-api" */ '../api/jsonp')
        );

        setStores(createStores(api))
    }, []);

    if (stores == null) {
        return <SplashScreen/>
    }

    return (
        <StoresContext.Provider value={stores}>
            {children}
        </StoresContext.Provider>
    )
}

export default StoresProvider;

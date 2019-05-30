/*
 * Copyright © 2019 Atomist, Inc.
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
 */

import {
    Configuration,
    logger,
} from "@atomist/automation-client";

/**
 * The starting point for building an SDM is here!
 */
export const configuration: Configuration = {
    postProcessors: [
        async cfg => {
            logger.info(`

Welcome to the Atomist SDM samples repository!

To start one of the sample SDMs in this repository, type:

    $ atomist start --repository-url=https://github.com/atomist/samples.git \
        --index=<one of the TypeScript files in the root of the repository, e.g. '01-menu.ts'>
`);
            process.exit(0);
            return cfg;
        },
    ],
};

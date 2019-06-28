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

/**
 * Atomist SDM Sample
 * @description SDM that uses containers to build projects against multiple versions of Node.
 * @tag sdm,container,node
 * @instructions <p>This SDM is now listening for pushes to repos with
 *               "package.json" files.  Push some new commits to one
 *               such repo and this SDM will checkout the code, install
 *               dependencies and run tests against multiple versions of
 *               Node.js in parallel.  Make sure your Docker CLI is
 *               configured properly.</p>
 */

// atomist:code-snippet:start=containerParallel
/**
 * Build you Node.js project against multiple versions of Node.js at
 * the same time.  When providing the `goals` property array, each
 * element of the array is a "step", dependent on all previous
 * elements.  If an individual element of the goals array is an array,
 * all elements of the subarray are run in parallel.
 */
import { hasFile } from "@atomist/sdm";
import {
    configure,
    container,
} from "@atomist/sdm-core";

export const configuration = configure(async sdm => {
    return {
        node: {
            test: hasFile("package.json"),
            goals: [
                ["8.16.0", "10.16.0", "11.15.0", "12.4.0"].map(v => container(
                    `node${v.replace(/\..*/g, "")}`,
                    {
                        containers: [{
                            args: ["sh", "-c", "npm install && npm test"],
                            env: [{ name: "NODE_ENV", value: "development" }],
                            image: `node:${v}`,
                            name: "npm",
                        }],
                        dockerOptions: [],
                    },
                )),
            ],
        },
    };
});
// atomist:code-snippet:end

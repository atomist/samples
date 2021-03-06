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
 * @description SDM that uses container and non-container goals.
 * @tag sdm,container
 * @instructions <p>This SDM is now listening for pushes to repos with
 *               "package.json" files.  Push some new commits to one
 *               such repo and this SDM will checkout the code, run the
 *               autofix, install dependencies and run tests.  Make sure
 *               your Docker CLI is configured properly.</p>
 */

// atomist:code-snippet:start=container-mix
/**
 * Mix container and non-container goals in the same goal set.
 */
import {
    Autofix,
    hasFile,
} from "@atomist/sdm";
import {
    configure,
    container,
} from "@atomist/sdm-core";
import { npmAuditAutofix } from "@atomist/sdm-pack-node";

export const configuration = configure(async sdm => {
    return {
        node: {
            test: hasFile("package.json"),
            goals: [
                new Autofix().with(npmAuditAutofix()),
                container("node", {
                    containers: [{
                        args: ["sh", "-c", "npm install && npm test"],
                        env: [{ name: "NODE_ENV", value: "development" }],
                        image: "node:12.4.0",
                        name: "npm",
                    }],
                }),
            ],
        },
    };
});
// atomist:code-snippet:end

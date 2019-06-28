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
 * @description SDM that uses containers to build Node.js project and their Docker images.
 * @tag sdm,container,node,docker,kaniko
 * @instructions <p>This SDM is now listening for pushes to repos with
 *               "package.json" files.  Push some new commits to one
 *               such repo and this SDM will checkout the code, install
 *               dependencies, run tests, and build a Docker image.
 *               Make sure your Docker CLI is configured properly.</p>
 */

// atomist:code-snippet:start=containerCache
/**
 * This container goal example introduces input and output values for
 * each goal using goal caching with the provided configuration.  The
 * "docker" goal set is dependent on the "node" goal set.
 */
import { hasFile } from "@atomist/sdm";
import {
    CompressingGoalCache,
    configure,
    container,
} from "@atomist/sdm-core";
import * as os from "os";
import * as path from "path";

export const configuration = configure(async sdm => {
    sdm.configuration.sdm.cache = {
        enabled: true,
        path: path.join(os.homedir(), ".atomist", "cache", "container"),
        store: new CompressingGoalCache(),
    };
    return {
        node: {
            test: hasFile("package.json"),
            goals: [
                container("node", {
                    containers: [{
                        args: ["sh", "-c", "npm install && npm test"],
                        env: [{ name: "NODE_ENV", value: "development" }],
                        image: "node:12.4.0",
                        name: "npm",
                    }],
                    output: [{
                        classifier: "node-modules",
                        pattern: { directory: "node_modules" },
                    }],
                }),
            ],
        },
        docker: {
            test: hasFile("Dockerfile"),
            dependsOn: ["node"],
            goals: [
                container("docker", {
                    containers: [{
                        args: [
                            "--context=dir://atm/home",
                            "--destination=atomist/samples:0.1.0",
                            "--dockerfile=Dockerfile",
                            "--no-push",
                            "--single-snapshot",
                        ],
                        image: "gcr.io/kaniko-project/executor:v0.10.0",
                        name: "kaniko",
                    }],
                    input: ["node-modules"],
                }),
            ],
        },
    };
});
// atomist:code-snippet:end

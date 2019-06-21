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
 * @description SDM that uses containers to build projects against multiple versions of Node and Maven.
 * @tag sdm,container,node,maven
 * @instructions <p>This SDM is now listening for pushes to repos with
 *               "package.json" and "pom.xml" files.  Push some new commits
 *               to one such repo and this SDM will checkout the code, install
 *               dependencies and run tests against multiple versions of the
 *               appropriate runtime in parallel.  Make sure your Docker CLI
 *               is configured properly.</p>
 */

// atomist:code-snippet:start=containerNodeMaven
/**
 * Build you Node.js and Maven project against multiple versions of
 * each runtime at the same time.
 */
import { hasFile } from "@atomist/sdm";
import {
    configure,
    containerGoal,
} from "@atomist/sdm-core";

export const configuration = configure(async sdm => {
    return {
        node: {
            test: hasFile("package.json"),
            goals: [
                ["8.16.0", "10.16.0", "11.15.0", "12.4.0"].map(v => containerGoal(
                    `node${v.replace(/\..*/g, "")}`,
                    {
                        containers: [{
                            args: ["sh", "-c", "npm install && npm test"],
                            env: [{ name: "NODE_ENV", value: "development" }],
                            image: `node:${v}`,
                            name: "npm",
                        }],
                    },
                )),
            ],
        },
        maven: {
            test: hasFile("pom.xml"),
            goals: [
                ["8", "11", "12"].map(v => containerGoal(
                    `mvn${v}`,
                    {
                        containers: [{
                            args: ["mvn", "test"],
                            image: `maven:3.6.1-jdk-${v}`,
                            name: "maven",
                        }],
                    },
                )),
            ],
        },
    };
});
// atomist:code-snippet:end

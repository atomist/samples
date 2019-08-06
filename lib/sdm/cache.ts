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
 * @description SDM that uses goal caching.
 * @tag sdm,cache,node
 * @instructions <p>This SDM is now listening for pushes to repos with
 *               "package.json" files.  Push some new commits to one
 *               such repo and this SDM will checkout the code, install
 *               dependencies, and run `npm run lint` & `npm test` in
 *               separate goals, caching the node_modules directory
 *               between.</p>
 */

// atomist:code-snippet:start=cache
/**
 * This goal example shows how to cache output from one goal and make
 * it available in a subsequent goal.  The `onCacheMiss` property in
 * the object passed to `cacheRestore` provides a fallback if
 * restoring the cache fails.
 */
import {
    doWithProject,
    goal,
    hasFile,
    spawnLog,
} from "@atomist/sdm";
import {
    cachePut,
    cacheRestore,
    CompressingGoalCache,
    configure,
} from "@atomist/sdm-core";
import * as os from "os";
import * as path from "path";

export const configuration = configure(async sdm => {
    sdm.configuration.sdm.cache = {
        enabled: true,
        path: path.join(os.tmpdir(), "atomist-cache"),
        store: new CompressingGoalCache(),
    };
    const env = { ...process.env, NODE_ENV: "development" };
    const lint = goal({ uniqueName: "npm-lint" }, doWithProject(async pgi => {
        await pgi.spawn("npm", ["install"], { env });
        await pgi.spawn("npm", ["run", "lint"]);
    }))
        .withProjectListener(cachePut({
            entries: [
                { classifier: "node-modules", pattern: { directory: "node_modules" } },
            ],
        }));
    const test = goal({ uniqueName: "npm-test" }, doWithProject(async pgi => pgi.spawn("npm", ["test"], { env })))
        .withProjectListener(cacheRestore({
            entries: [{ classifier: "node-modules" }],
            onCacheMiss: {
                name: "npm-install",
                listener: async (p, gi) => spawnLog("npm", ["install"], { cwd: p.baseDir, env, log: gi.progressLog }),
            },
        }));
    return {
        check: {
            test: hasFile("package.json"),
            goals: [lint],
        },
        build: {
            test: hasFile("package.json"),
            dependsOn: ["check"],
            goals: [test],
        },
    };
});
// atomist:code-snippet:end

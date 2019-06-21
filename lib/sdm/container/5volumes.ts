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
 * @description SDM that uses containers with volumes to provide Docker credentials.
 * @tag sdm,container,node,docker,kaniko,callback,volumes
 * @instructions <p>This SDM is now listening for pushes to repos with
 *               "package.json" files.  Push some new commits to one
 *               such repo and this SDM will checkout the code, install
 *               dependencies, run tests, and build & push a Docker image.
 *               Make sure your Docker CLI is configured properly and
 *               logged in to Docker Hub.</p>
 */

// atomist:code-snippet:start=containerVolumes
/**
 * This container goal example introduces a callback so the name of
 * docker image can be derived from the repo.
 */
import { hasFile } from "@atomist/sdm";
import {
    CompressingGoalCache,
    configure,
    containerGoal,
} from "@atomist/sdm-core";
import * as os from "os";
import * as path from "path";

export const configuration = configure(async sdm => {
    sdm.configuration.sdm.cache = {
        enabled: true,
        path: path.join(os.homedir(), ".atomist", "cache", "container"),
    };
    sdm.configuration.sdm.goalCache = new CompressingGoalCache();
    return {
        node: {
            test: hasFile("package.json"),
            goals: [
                containerGoal("node", {
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
            dependsOn: ["node"],
            test: hasFile("Dockerfile"),
            goals: [
                containerGoal("docker", {
                    callback: async (r, p) => {
                        const safeOwner = p.id.owner.replace(/[^a-z0-9]+/g, "");
                        r.containers[0].args.push(`--destination=${safeOwner}/${p.id.repo}:${p.id.sha}`);
                        return r;
                    },
                    containers: [{
                        args: [
                            "--context=dir://atm/home",
                            "--dockerfile=Dockerfile",
                            "--single-snapshot",
                        ],
                        env: [{ name: "DOCKER_CONFIG", value: "/root/.docker" }],
                        image: "gcr.io/kaniko-project/executor:v0.10.0",
                        name: "kaniko",
                        volumeMounts: [{
                            mountPath: "/root/.docker",
                            name: "dockerconfig",
                        }],
                    }],
                    input: ["node-modules"],
                    volumes: [{
                        hostPath: {
                            path: path.join(os.homedir(), ".docker"),
                        },
                        name: "dockerconfig",
                    }],
                }),
            ],
        },
    };
});
// atomist:code-snippet:end

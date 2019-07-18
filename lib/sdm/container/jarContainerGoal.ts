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
    jvm: {
      goals: [
        container("build-jar", {
          containers: [
            {
              image: "maven:3.3-jdk-8",
              command: ["mvn"],
              args: ["clean", "install", "-B"],
              name: "maven",
            },
          ],
          output: [
            {
              classifier: "target-jar",
              pattern: { directory: "target/*.jar" },
            },
          ],
        }),
      ],
      test: hasFile("pom.xml"),
    },
    docker: {
      goals: [
        container("kaniko", {
          callback: async (reg, proj) => {
            // calculate image name from project information, removing non-alphanumeric characters
            const safeOwner = proj.id.owner.replace(/[^a-z0-9]+/g, "");
            const dest = `${safeOwner}/${proj.id.repo}:${proj.id.sha}`;
            reg.containers[0].args.push(`--destination=${dest}`);
            return reg;
          },
          input: ["target-jar"],
          containers: [{
            name: "kaniko",
            image: "gcr.io/kaniko-project/executor:v0.10.0",
            args: [
                "--dockerfile=Dockerfile",
                "--context=dir://atm/home",
                "--no-push",
                "--single-snapshot",
            ],
          }],
        }),
      ],
      test: hasFile("Dockerfile"),
      dependsOn: ["jvm"],
    },
  };
});

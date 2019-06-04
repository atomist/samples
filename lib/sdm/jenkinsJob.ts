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
    GoalInvocation,
    hasFile,
    isMaterialChange,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import {
    JenkinsRegistration,
    jenkinsRun,
} from "@atomist/sdm-pack-jenkins";
import * as fs from "fs-extra";
import * as hbx from "handlebars";
import * as path from "path";

/**
 * Atomist SDM Sample
 * @description SDM to demonstrate how to run and converge Jenkins jobs
 * @tag sdm,jenkins,maven
 * @instructions <p>Now that the SDM is up and running, make a commit to a Maven
 *               repository that has an Atomist webhook configured. You can observe
 *               the Jenkins goal from chat or https://app.atomist.com.
 *
 *               Note: Please configure the following environment variables so that
 *               this SDM can access your Jenkins instance: JENKINS_URL, JENKINS_USER
 *               and JENKINS_PASSWORD.</p>
 */

// atomist:code-snippet:start=jenkinsSdm
/**
 * Main entry point into the SDM
 */
export const configuration = configure(async () => {

    // The Jenkins goal needs access to the Jenkins master which
    // can be configured below
    const options: Pick<JenkinsRegistration, "server"> = {
        server: {
            url: process.env.JENKINS_URL || "http://127.0.0.1:8080",
            user: process.env.JENKINS_USER || "admin",
            password: process.env.JENKINS_PASSWORD || "123456",
        },
    };

    // Jenkins goal that runs a job named <repo_name>-build which will be
    // created or updated with a job definition returned by the mavenPipeline
    // function
    const build = jenkinsRun("build", {
        ...options,
        job: async gi => `${gi.goalEvent.repo.name}-build`,
        definition: async gi => mavenPipeline(gi),
    });

    // Single push rule that runs the build goal when the push is material and the project
    // has a pom.xml file
    return {
        "ci/cd": {
            test: [
                hasFile("pom.xml"),
                isMaterialChange({
                    extensions: ["java", "properties", "yaml"],
                    files: ["pom.xml"],
                })],
            goals: [
                build,
            ],
        },
    };
});

/**
 * Load the job definition from a local XML template
 */
async function mavenPipeline(gi: GoalInvocation): Promise<string> {
    const template = (await fs.readFile(path.join(__dirname, "maven.pipeline.xml"))).toString();
    const hb = hbx.compile(template);
    return hb({ gi });
}
// atomist:code-snippet:end

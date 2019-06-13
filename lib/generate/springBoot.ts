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
    GitCommandGitProject,
    GitHubRepoRef,
    HttpMethod,
} from "@atomist/automation-client";
import {
    CommandListenerInvocation,
    GeneratorRegistration,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import * as _ from "lodash";
import { promisify } from "util";
import { parseString } from "xml2js";

const ps = promisify(parseString);

/**
 * Atomist SDM Sample
 * @description SDM to create a new Spring Boot project showing promptFor from generators
 * @tag sdm,generator
 * @instructions <p>Now that the SDM is up and running, create a new Spring Boot
 *               project by running '@atomist create spring project'.</p>
 */

const SpringBootMavenVersions = "http://repo2.maven.org/maven2/org/springframework/boot/spring-boot/maven-metadata.xml";

const SimpleGenerator: GeneratorRegistration = {
    name: "SimpleGenerator",
    intent: "create spring project",
    description: "Creates a new Spring Boot project",
    autoSubmit: true,
    startingPoint: async pi => {

        // Obtain all Spring Boot versions from Maven Central
        const mavenVersions = (await pi.configuration.http.client.factory.create(SpringBootMavenVersions)
            .exchange<string>(SpringBootMavenVersions, { method: HttpMethod.Get })).body;
        const versions = (await ps(mavenVersions) as any).metadata.versioning[0].versions[0].version;

        // Ask for an additional version parameter
        const params = await (pi as any as CommandListenerInvocation<any>)
            .promptFor<{ version: string }>({
                version: {
                    description: "Desired Spring Boot version",
                    type: { options: _.map(versions, v => ({ value: v, description: v })).reverse() },
                },
            });

        // Store the version parameter with the command parameters for later access
        (pi.parameters as any).version = params.version;

        return GitCommandGitProject.cloned(
            pi.credentials,
            GitHubRepoRef.from({ owner: "atomist-seeds", repo: "spring-rest", branch: "master" }),
            { depth: 1 });
    },
    transform: [
        // Code Transform to edit the Spring Boot version in the pom.xml file
        async (p, papi) => {
            const pomFile = await p.getFile("pom.xml");
            const pom = (await pomFile.getContent())
                .replace(/(<parent>[\s\S]*<version>)(.*)(<\/version>[\s\S]*<\/parent>)/gm, `$1${(papi.parameters as any).version}$3`);
            await pomFile.setContent(pom);
            return p;
        },
    ],
};

export const configuration = configure(async sdm => {

    // Register the generator with the SDM
    sdm.addGeneratorCommand(SimpleGenerator);

});

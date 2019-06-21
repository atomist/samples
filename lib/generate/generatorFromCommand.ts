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

import { GitHubRepoRef } from "@atomist/automation-client";
import { GeneratorRegistration } from "@atomist/sdm";
import {
    configure,
    invokeCommand,
} from "@atomist/sdm-core";

/**
 * Atomist SDM Sample
 * @description SDM to create a new Spring Boot project showing how to invoke a generator from a command
 * @tag sdm,generator
 * @instructions <p>Now that the SDM is up and running, create a new Spring Boot
 *               project by running '@atomist create spring project'.</p>
 */

const SpringBootVersion = "2.1.6.RELEASE";

const SimpleGenerator: GeneratorRegistration = {
    name: "SimpleGenerator",
    description: "Creates a new Spring Boot project",
    startingPoint: GitHubRepoRef.from({ owner: "atomist-seeds", repo: "spring-rest", branch: "master" }),
    transform: [
        // Code Transform to edit the Spring Boot version in the pom.xml file
        async p => {
            const pomFile = await p.getFile("pom.xml");
            const pom = (await pomFile.getContent())
                .replace(/(<parent>[\s\S]*<version>)(.*)(<\/version>[\s\S]*<\/parent>)/gm, `$1${SpringBootVersion}$3`);
            await pomFile.setContent(pom);
            return p;
        },
    ],
};

export const configuration = configure(async sdm => {

    // Register the generator with the SDM
    sdm.addGeneratorCommand(SimpleGenerator);

    sdm.addCommand({
        name: "RunGeneratorFromCommand",
        description: "Run the Spring Boot generator",
        intent: "create spring project",
        autoSubmit: true,
        parameters: {
            "target.owner": {},
            "target.repo": {},
        },
        listener: async ci => {
            return invokeCommand(
                SimpleGenerator,
                {
                    ...ci.parameters,
                },
                ci.context);
        },
    });

});

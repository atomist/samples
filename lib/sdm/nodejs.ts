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
    GitHubRepoRef,
} from "@atomist/automation-client";
import { PullRequest } from "@atomist/automation-client/lib/operations/edit/editModes";
import { scanFreePort } from "@atomist/automation-client/lib/util/port";
import {
    actionableButton,
    allSatisfied,
    anySatisfied,
    CodeTransformRegistration,
    CommandHandlerRegistration,
    DoNotSetAnyGoals,
    execPromise,
    GeneratorRegistration,
    goal,
    hasFile,
    not,
    SdmGoalState,
    slackSuccessMessage,
    ToDefaultBranch,
} from "@atomist/sdm";
import {
    configure,
    Version,
} from "@atomist/sdm-core";
import { Build } from "@atomist/sdm-pack-build";
import {
    DockerBuild,
    HasDockerfile,
} from "@atomist/sdm-pack-docker";
import {
    nodeBuilder,
    NodeProjectCreationParameters,
    NodeProjectCreationParametersDefinition,
    NodeProjectVersioner,
    NpmInstallProjectListener,
    NpmVersionProjectListener,
    UpdatePackageJsonIdentification,
} from "@atomist/sdm-pack-node";
import {
    bold,
    codeLine,
    url,
} from "@atomist/slack-messages";

/**
 * Atomist SDM Sample
 * @description SDM to create and build NodeJS projects
 * @tag sdm,generator,nodejs
 * @instructions <p>Now that the SDM is up and running, create a new Typescript
 *               project by running '@atomist create typescript project' and
 *               observe how the SDM will build and run the new project. Then
 *               issue `@atomist create dockerfile` which will add a Dockerfile to
 *               your project and initiate a docker build and run.
 *
 *               The docker build and run goals require a locally accessible
 *               docker daemon. Please make sure to configure your terminal for
 *               docker access.</p>
 */

/**
 * Typescript generator registration
 */
const TypescriptGenerator: GeneratorRegistration<NodeProjectCreationParameters> = {
    name: "TypescriptGenerator",
    intent: "create typescript project",
    description: "Creates a new Typescript project",
    tags: ["typescript"],
    autoSubmit: true,
    parameters: NodeProjectCreationParametersDefinition,
    startingPoint: GitHubRepoRef.from({ owner: "atomist-seeds", repo: "typescript-express-node", branch: "master" }),
    transform: [
        UpdatePackageJsonIdentification,
    ],
};

/*
 * Command to stop a container by provided container id
 */
const StopDockerContainerCommand: CommandHandlerRegistration<{ containerId: string }> = {
    name: "StopDockerContainer",
    description: "Stop a running Docker container",
    intent: "stop container",
    parameters: {
        containerId: { description: "Id of the container to stop" },
    },
    listener: async ci => {
        await execPromise("docker", ["stop", ci.parameters.containerId]);
        await ci.addressChannels(
            slackSuccessMessage(
                "Docker Deployment",
                `Successfully stopped deployment`),
            { id: ci.parameters.containerId },
        );
    },
};

const CreateDockerFileTransform: CodeTransformRegistration = {
    name: "CreateDockerFileTransform",
    description: "Create a dockerfile for this project",
    intent: "create dockerfile",
    transform: async p => {
        const DockerfileContent = `FROM node:10
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run compile
# Configure
EXPOSE 8080
CMD [ "npm", "run", "start" ]`;
        await p.addFile("Dockerfile", DockerfileContent);
    },
    transformPresentation: papi => new PullRequest(
        "add-dockerfile",
        "Add Dockerfile",
        "Adding a Dockerfile",
    ),
};

export const configuration = configure(async sdm => {

    // Register the generator and stop command with the SDM
    sdm.addGeneratorCommand(TypescriptGenerator);
    sdm.addCommand(StopDockerContainerCommand);
    sdm.addCodeTransformCommand(CreateDockerFileTransform);

    // Version goal calculates a timestamped version for the build goal
    const versionGoal = new Version()
        .withVersioner(NodeProjectVersioner);

    const buildGoal = new Build()
        .with({
            builder: nodeBuilder({command: "npm", args: ["run", "compile"]}),
        })
        .withProjectListener(NpmInstallProjectListener);

    // Docker build to wrap the app into a container image
    const dockerBuildGoal = new DockerBuild()
        .with({
            dockerfileFinder: async () => "Dockerfile", // where to find the Dockerfile
            push: false, // skip pushing the image to a remote repository; can be enabled by providing credentials
            dockerImageNameCreator: async (p, sdmGoal) => [{
                registry: p.id.owner,
                name: p.id.repo,
                tags: [
                    `${sdmGoal.branch}-${sdmGoal.sha.slice(0, 7)}`,
                    "latest",
                ],
            }],
        })
        .withProjectListener(NpmVersionProjectListener);

    // Docker run goal to start the application in a container
    const dockerRunGoal = goal(
        { displayName: "docker run" },
        async gi => {
            const { goalEvent, progressLog } = gi;

            const host = readDockerHost();
            const port = await scanFreePort(9500, 9600);
            const appUrl = `http://${host}:${port}`;

            const slug = `${goalEvent.repo.owner}/${goalEvent.repo.name}`;
            const image = `${slug}:${goalEvent.branch}-${goalEvent.sha.slice(0, 7)}`;

            try {
                const result = await execPromise(
                    "docker",
                    ["run", "-d", "-p", `${port}:8080`, image],
                );
                const containerId = result.stdout.trim();
                await gi.addressChannels(
                    slackSuccessMessage(
                        "Docker Deployment",
                        `Successfully started ${codeLine(goalEvent.sha.slice(0, 7))} of ${bold(slug)} at ${url(appUrl)}`,
                        {
                            actions: [
                                actionableButton(
                                    { text: "Stop" },
                                    StopDockerContainerCommand,
                                    {
                                        containerId,
                                    }),
                            ],
                        },
                    ),
                    { id: containerId });

                return {
                    state: SdmGoalState.success,
                    externalUrls: [
                        { label: "http", url: appUrl },
                    ],
                };

            } catch (e) {
                progressLog.write(`Container run command failed: %s`, e.message);
                return {
                    code: 1,
                };
            }
        });

    // This SDM has three PushRules: no goals, build and docker
    return {
        no_goals: {
            test: anySatisfied(not(hasFile("package.json")), not(hasFile("tsconfig.json"))),
            goals: DoNotSetAnyGoals.andLock(),
        },
        build: {
            goals: [
                versionGoal,
                buildGoal,
            ],
        },
        docker: {
            test: allSatisfied(ToDefaultBranch, HasDockerfile),
            dependsOn: "build",
            goals: [
                dockerBuildGoal,
                dockerRunGoal,
            ],
        },
    };
}, { name: "typescript" });

/**
 * Read the Docker hostname from the DOCKER_HOST environment variable
 */
function readDockerHost(): string | undefined {
    const dockerhost = process.env.DOCKER_HOST;
    if (!dockerhost) {
        throw new Error("DOCKER_HOST environment variable not set");
    }
    return new URL(dockerhost).hostname;
}

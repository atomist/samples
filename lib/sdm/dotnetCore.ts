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
import { scanFreePort } from "@atomist/automation-client/lib/util/port";
import {
    actionableButton,
    and,
    CommandHandlerRegistration,
    DoNotSetAnyGoals,
    execPromise,
    GeneratorRegistration,
    goal,
    hasFile,
    hasFileWithExtension,
    not,
    or,
    SdmGoalState,
    slackSuccessMessage,
} from "@atomist/sdm";
import {
    configure,
    Version,
} from "@atomist/sdm-core";
import {
    dotnetCoreBuilder,
    DotnetCoreProjectFileCodeTransform,
    DotnetCoreProjectVersioner,
    DotnetCoreVersionProjectListener,
    getDockerfile,
} from "@atomist/sdm-pack-analysis-dotnet";
import { Build } from "@atomist/sdm-pack-build";
import {
    DockerBuild,
    HasDockerfile,
} from "@atomist/sdm-pack-docker";
import {
    bold,
    codeLine,
    url,
} from "@atomist/slack-messages";
import { replaceSeedSlug } from "../transform/replaceSeedSlug";
import { UpdateReadmeTitle } from "../transform/updateReadmeTitle";

/**
 * Atomist SDM Sample
 * @description SDM to create and build .NET Core projects
 * @tag sdm,generator,dotnet-core
 * @instructions <p>Now that the SDM is up and running, create a new .NET Core
 *               project by running '@atomist create dotnet-core project' and
 *               observe how the SDM will build and dockerize the new project.
 *
 *               The docker build and run goals require a locally accessible
 *               docker daemon. Please make sure to configure your terminal for
 *               docker access.</p>
 */

// atomist:code-snippet:start=dotnetGenerator
/**
 * .NET Core generator registration
 */
const DotnetCoreGenerator: GeneratorRegistration = {
    name: "DotnetCoreGenerator",
    intent: "create dotnet-core project",
    description: "Creates a new .NET Core project",
    tags: ["dotnet"],
    autoSubmit: true,
    startingPoint: GitHubRepoRef.from({ owner: "atomist-seeds", repo: "dotnet-core-service", branch: "master" }),
    transform: [
        UpdateReadmeTitle,
        replaceSeedSlug("atomist-seeds", "dotnet-core-service"),
        DotnetCoreProjectFileCodeTransform,
    ],
};
// atomist:code-snippet:end

/**
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

export const configuration = configure(async sdm => {

    // Register the generator and stop command with the SDM
    sdm.addGeneratorCommand(DotnetCoreGenerator);
    sdm.addCommand(StopDockerContainerCommand);

    // Version goal calculates a timestamped version for the build goal
    const versionGoal = new Version()
        .withVersioner(DotnetCoreProjectVersioner);

    // Build goal that runs "dotnet build"
    const buildGoal = new Build(
        { displayName: "dotnet build" })
        .with({
            name: "dotnet-build",
            builder: dotnetCoreBuilder(),
        }).withProjectListener(DotnetCoreVersionProjectListener);

    // Docker build to wrap the app into a container image
    const dockerBuildGoal = new DockerBuild()
        .with({
            dockerfileFinder: getDockerfile, // where to find the Dockerfile
            push: false, // skip pushing the image to a remote repository; can be enabled by providing credentials
            dockerImageNameCreator: async (p, sdmGoal) => [{
                registry: p.id.owner,
                name: p.id.repo,
                tags: [
                    `${sdmGoal.branch}-${sdmGoal.sha.slice(0, 7)}`,
                    "latest",
                ],
            }],
        });

    // Docker run goal to start the application in a container
    const dockerRunGoal = goal(
        { displayName: "docker run" },
        async gi => {
            const { goalEvent, progressLog } = gi;

            const host = readDockerHost();
            const port = await scanFreePort(8000, 8100);
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
            test: not(hasFileWithExtension("csproj")),
            goals: DoNotSetAnyGoals.andLock(),
        },
        build: {
            goals: [
                versionGoal,
                buildGoal,
            ],
        },
        docker: {
            test: HasDockerfile,
            dependsOn: "build",
            goals: [
                dockerBuildGoal,
                dockerRunGoal,
            ],
        },
    };
}, { name: "dotnetCore" });

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

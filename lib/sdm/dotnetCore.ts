import { GitHubRepoRef } from "@atomist/automation-client";
import {
    GeneratorRegistration,
    goal,
    hasFileWithExtension,
    spawnLog,
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

export const configuration = configure(async sdm => {

    // Register the generator with the SDM
    sdm.addGeneratorCommand(DotnetCoreGenerator);

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
            dockerImageNameCreator: async (p, sdmGoal) => [
                { registry: p.id.owner, name: p.id.repo, tags: [`${sdmGoal.branch}-${sdmGoal.sha.slice(0, 7)}`, "latest"] },
            ],
        });

    // Docker run goal to start the application in a container
    const dockerRunGoal = goal(
        { displayName: "docker run" },
        async gi => {
            const { sdmGoal, progressLog } = gi;
            const image = `${sdmGoal.repo.owner}/${sdmGoal.repo.name}:${sdmGoal.branch}-${sdmGoal.sha.slice(0, 7)}`;
            return spawnLog("docker", ["run", "-d", "-p", "8080:8080", image], { log: progressLog });
        });

    // This SDM has two PushRules: build and docker
    return {
        build: {
            test: hasFileWithExtension("csproj"),
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
});

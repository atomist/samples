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
    Configuration,
    GitHubRepoRef,
    InMemoryProject,
} from "@atomist/automation-client";
import {
    fakePush,
    Goal,
    GoalWithPrecondition,
    PushListenerInvocation,
    SoftwareDeliveryMachine,
    SoftwareDeliveryMachineConfiguration,
} from "@atomist/sdm";
import { SdmInstanceContainer } from "@atomist/sdm-core/lib/internal/machine/LocalSoftwareDeliveryMachineOptions";
import * as assert from "power-assert";
import { configuration } from "../../lib/sdm/dotnetCore";

describe(".NET Core SDM", () => {
    const favoriteRepoRef = GitHubRepoRef.from({
        owner: "atomist",
        repo: "samples",
        sha: "75132357b19889c4d6c2bef99fce8f477e1f2196",
        branch: "testing",
    });

    it("should plan version and build goals", async () => {
        const testProject = InMemoryProject.from(favoriteRepoRef,
            {path: "test.csproj", content: ""});

        const sdm = await getTestSdmInstance(configuration);
        const goals = await getGoalsForPushOnProject(sdm, fakePush(testProject));
        assert(goals.length === 2);
        assert(goals.some(goal => goal.definition.displayName === "version"));
        assert(goals.some(goal => goal.definition.displayName === "dotnet build"));
    });

    it("should plan version and build and docker goals", async () => {
        const testProject = InMemoryProject.from(favoriteRepoRef,
            {path: "test.csproj", content: ""}, {path: "Dockerfile", content: ""});

        const sdm = await getTestSdmInstance(configuration);
        const goals = await getGoalsForPushOnProject(sdm, fakePush(testProject));

        assert(goals.length === 4);
        assert(goals.some(goal => goal.definition.displayName === "version"));
        assert(goals.some(goal => goal.definition.displayName === "dotnet build"));
        assert(goals.some(goal => goal.definition.displayName === "docker build"));
        assert(goals.some(goal => goal.definition.displayName === "docker run"));
    });

    it("should not plan goals", async () => {
        const testProject = InMemoryProject.from(favoriteRepoRef,
            {path: "Dockerfile", content: ""});

        const sdm = await getTestSdmInstance(configuration);
        const goals = await getGoalsForPushOnProject(sdm, fakePush(testProject));

        assert(goals.length === 0);
    });
});

async function getTestSdmInstance(config: Configuration): Promise<SoftwareDeliveryMachine> {
    const sdmConfig: SoftwareDeliveryMachineConfiguration = {
        name: "test",
        ...configuration,
        sdm: {},
    };
    const results = sdmConfig.postProcessors.map(async p => p(sdmConfig))
        .filter(async result => !!((await result).sdmInstance));
    return (await results[0] as SdmInstanceContainer).sdmInstance;
}

async function getGoalsForPushOnProject(sdm: SoftwareDeliveryMachine, pli: PushListenerInvocation): Promise<Goal[]> {
    const mappingGoals = await sdm.pushMapping.mapping(pli);
    if (mappingGoals === undefined) {
        return [];
    }
    const plannableGoalUniqueNames = mappingGoals.goals.map(g => {
        if (goalCanBePlanned(g, mappingGoals.goals)) {
            return g.definition.uniqueName;
        } else {
            return undefined;
        }
    });
    return mappingGoals.goals.filter(g => {
        if (hasPrecondition(g)) {
            if (!g.dependsOn.every(dep => plannableGoalUniqueNames.includes(dep.definition.uniqueName))) {
                return false;
            }
        }
        return plannableGoalUniqueNames.includes(g.definition.uniqueName);
    });
}

function goalCanBePlanned(g: Goal, context: Goal[]): boolean {
    if (hasPrecondition(g)) {
        return g.dependsOn.every(dep => {
            return goalCanBePlanned(dep, context) && !!context.find(goal => goal.definition.uniqueName === dep.definition.uniqueName);
        });
    } else {
        return true;
    }
}

function hasPrecondition(goal: Goal | GoalWithPrecondition): goal is GoalWithPrecondition {
    return (goal as any).dependsOn !== undefined;
}

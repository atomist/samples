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
<<<<<<< HEAD
    GitHubRepoRef,
=======
>>>>>>> Clean up testing support
    InMemoryProject,
} from "@atomist/automation-client";
import {
    fakePush,
    Goal,
    PushListenerInvocation,
    SoftwareDeliveryMachine,
} from "@atomist/sdm";
import * as assert from "assert";
import {
    mockConfigure,
    unmockConfigure,
} from "./mockConfigure";

describe(".NET Core SDM", () => {

    beforeEach(mockConfigure);
    afterEach(unmockConfigure);

    it("should plan version and build goals", async () => {
        const testProject = InMemoryProject.of({ path: "test.csproj", content: "" });

        const sdm = await getTestSdmInstance(require("../../lib/sdm/dotnetCore").configuration);
        const goals = await getGoalsForPushOnProject(sdm, fakePush(testProject));

        assert(goals.length === 2);
        assert(goals.some(goal => goal.definition.displayName === "version"));
        assert(goals.some(goal => goal.definition.displayName === "dotnet build"));
    });

    it("should plan version and build and docker goals", async () => {
        const testProject = InMemoryProject.of({ path: "test.csproj", content: "" }, { path: "Dockerfile", content: "" });

        const sdm = await getTestSdmInstance(require("../../lib/sdm/dotnetCore").configuration);
        const goals = await getGoalsForPushOnProject(sdm, fakePush(testProject));

        assert(goals.length === 4);
        assert(goals.some(goal => goal.definition.displayName === "version"));
        assert(goals.some(goal => goal.definition.displayName === "dotnet build"));
        assert(goals.some(goal => goal.definition.displayName === "docker build"));
        assert(goals.some(goal => goal.definition.displayName === "docker run"));
    });

    // This test is actually wrong; an SDM goal with a preCondition to a goal that isn't planned
    // will still be planned without that preCondition
    it("should plan only two docker goals", async () => {
        const testProject = InMemoryProject.of({ path: "Dockerfile", content: "" });

        const sdm = await getTestSdmInstance(require("../../lib/sdm/dotnetCore").configuration);
        const goals = await getGoalsForPushOnProject(sdm, fakePush(testProject));

        assert(goals.length === 2);
    });
});

async function getTestSdmInstance(config: Promise<Configuration>): Promise<SoftwareDeliveryMachine> {
    return (await config).sdm as SoftwareDeliveryMachine;
}

async function getGoalsForPushOnProject(sdm: SoftwareDeliveryMachine, pli: PushListenerInvocation): Promise<Goal[]> {
    const mappingGoals = await sdm.pushMapping.mapping(pli);
    if (mappingGoals === undefined) {
        return [];
    }
    return mappingGoals.goals;
}

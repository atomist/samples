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

import { InMemoryProject } from "@atomist/automation-client";
import { fakePush } from "@atomist/sdm";
import * as assert from "assert";
import {
    mockSdm,
    planGoals,
} from "./mockConfigure";

describe(".NET Core SDM", () => {

    it("should plan version and build goals", async () => {
        const testProject = InMemoryProject.of({ path: "test.csproj", content: "" });

        const sdm = await mockSdm("../../lib/sdm/dotnetCore");
        const goals = await planGoals(sdm, fakePush(testProject));
        const goalNames = goals.map(goal => goal.definition.displayName);
        assert.strictEqual(goals.length, 2);
        assert.deepStrictEqual(goalNames, ["version", "dotnet build"]);
    });

    it("should plan version and build and docker goals", async () => {
        const testProject = InMemoryProject.of({ path: "test.csproj", content: "" }, { path: "Dockerfile", content: "" });

        const sdm = await mockSdm("../../lib/sdm/dotnetCore");
        const goals = await planGoals(sdm, fakePush(testProject));
        const goalNames = goals.map(goal => goal.definition.displayName);

        assert.strictEqual(goals.length, 4);
        assert.deepStrictEqual(goalNames, ["version", "dotnet build", "docker build", "docker run"]);
    });

    it("should not plan any goals", async () => {
        const testProject = InMemoryProject.of({ path: "Dockerfile", content: "" });

        const sdm = await mockSdm("../../lib/sdm/dotnetCore");
        const goals = await planGoals(sdm, fakePush(testProject));

        assert.strictEqual(goals.length, 0);
    });
});

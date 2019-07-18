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
} from "../mockConfigure";

describe("jar Container Goal SDM", () => {

  it("should plan to build JAR if there is a pom.xml", async () => {
    const testProject = InMemoryProject.of({ path: "pom.xml", content: "" });

    const sdm = await mockSdm("../../lib/sdm/container/jarContainerGoal");
    const goals = await planGoals(sdm, fakePush(testProject));
    const goalNames = goals.map(goal => goal.definition.displayName);
    assert.strictEqual(goals.length, 1);
    assert.deepStrictEqual(goalNames, ["build-jar"]);
  });

  it("should plan to build Docker image if there is a Dockerfile", async () => {
    const testProject = InMemoryProject.of({ path: "Dockerfile", content: "" }, { path: "pom.xml", content: "" });

    const sdm = await mockSdm("../../lib/sdm/container/jarContainerGoal");
    const goals = await planGoals(sdm, fakePush(testProject));
    const goalNames = goals.map(goal => goal.definition.displayName);
    assert.strictEqual(goals.length, 2);
    assert.deepStrictEqual(goalNames, ["build-jar", "kaniko"]);
  });

  it("should not build Docker image if there is only a Dockerfile", async () => {
    const testProject = InMemoryProject.of({ path: "Dockerfile", content: "" });

    const sdm = await mockSdm("../../lib/sdm/container/jarContainerGoal");
    const goals = await planGoals(sdm, fakePush(testProject));
    assert.strictEqual(goals.length, 0);
  });

  it("should not plan any goals", async () => {
    const testProject = InMemoryProject.of({ path: "test.txt", content: "" });

    const sdm = await mockSdm("../../lib/sdm/container/jarContainerGoal");
    const goals = await planGoals(sdm, fakePush(testProject));

    assert.strictEqual(goals.length, 0);
  });
});

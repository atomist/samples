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
    GitProject,
} from "@atomist/automation-client";
import * as assert from "assert";
import {
    mockSdm,
    planGoals,
} from "../testsupport/mockConfigure";
import {
    createTempGitProject,
    simulatePushWithChanges,
} from "../testsupport/testSupport";

export async function createBaseGitProject(): Promise<GitProject> {
    const project = await createTempGitProject();
    await project.addFile("pom.xml", "");
    await project.commit("init");
    return project;
}

describe("Jenkins job SDM", () => {

    it("should not plan goals if there is no POM", async () => {
        const testProject = await createBaseGitProject();
        const sdm = await mockSdm("../../lib/sdm/jenkinsJob");
        const push = await simulatePushWithChanges(testProject, {
            filesDeleted: ["pom.xml"]});
        const goals = await planGoals(sdm, push);
        assert.strictEqual(goals.length, 0);
    });

    it("should not plan goals if there is no substantial change", async () => {
        const testProject = await createBaseGitProject();
        const sdm = await mockSdm("../../lib/sdm/jenkinsJob");
        const push = await simulatePushWithChanges(testProject, {
            filesAdded: [{path: "TESTREADME", content: ""}]});
        const goals = await planGoals(sdm, push);
        assert.strictEqual(goals.length, 0);
    }).enableTimeouts(false);

    it("should plan goals if there is a substantial change", async () => {
        const testProject = await createBaseGitProject();
        const sdm = await mockSdm("../../lib/sdm/jenkinsJob");
        const push = await simulatePushWithChanges(testProject, {
            filesAdded: [{path: "test.java", content: ""}]});
        const goals = await planGoals(sdm, push);
        assert.strictEqual(goals.length, 1);
    }).enableTimeouts(false);
});

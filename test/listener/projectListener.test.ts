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

import { GitProject } from "@atomist/automation-client";
import { GoalProjectListenerEvent } from "@atomist/sdm";
import { Build } from "@atomist/sdm-pack-build";
import * as assert from "power-assert";
import {
    mockSdm,
    planGoals,
} from "../testsupport/mockConfigure";
import {
    createTempGitProject,
    simulatePushWithChanges,
} from "../testsupport/testSupport";

const packageJson = `{
  "name": "@atomist/samples",
  "version": "0.1.0",
  "description": "Samples showcasing some of the features of the Atomist SDM framework and platform",
  "dependencies": {
  },
  "devDependencies": {
    "typescript": "^3.5.1"
  },
  "scripts": {
    "compile": "tsc --project .",
  }
}
`;

const index = `class Index {
    public answerToLife(): number {
        return 42;
    }
}`;

export async function createBaseGitProject(): Promise<GitProject> {
    const project = await createTempGitProject();
    await project.addFile("package.json", packageJson);
    await project.commit("init");
    return project;
}

describe("Project listener", () => {
    it("should be added to goal", async () => {
        const testProject = await createBaseGitProject();
        const sdm = await mockSdm("../../lib/listener/projectListener");
        const push = await simulatePushWithChanges(testProject, {
            filesAdded: [{path: "index.ts", content: index}]});
        const goals = await planGoals(sdm, push);
        assert.strictEqual(goals.length, 1);
        const buildGoal = goals[0] as Build;
        assert.strictEqual(buildGoal.projectListeners.length, 1);
        assert.deepStrictEqual(buildGoal.projectListeners[0].events, [GoalProjectListenerEvent.before]);
        assert.strictEqual(buildGoal.projectListeners[0].name, "execute npm install");
    });
});

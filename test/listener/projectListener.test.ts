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

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
    GitCommandGitProject,
    GitHubRepoRef,
    GitProject,
    guid,
    NodeFsLocalProject,
    RemoteRepoRef,
} from "@atomist/automation-client";
import {
    AddressNoChannels,
    fakeContext,
    fakePush,
    NoPreferenceStore,
    PushListenerInvocation,
} from "@atomist/sdm";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export async function createTempGitProject(): Promise<GitProject> {
    const projectDir = (path.join(os.tmpdir(), guid()));
    fs.mkdirSync(projectDir);
    const localProject = NodeFsLocalProject.fromExistingDirectory(fakePush().id, projectDir);
    let gitProject = GitCommandGitProject.fromProject(await localProject, {token: undefined});
    gitProject = await gitProject.init();
    return gitProject;
}

export async function simulatePushWithChanges(project: GitProject, options: {
    filesAdded?: Array<{path: string, content: string}>,
    filesChanged?: Array<{path: string, content: string}>,
    filesDeleted?: string[],
}): Promise<PushListenerInvocation> {
    const preStatus = await project.gitStatus();
    if (!!options.filesAdded) {
        await Promise.all(options.filesAdded.map(async file => {
            await project.addFile(file.path, file.content);

        }));
    }
    if (!!options.filesChanged) {
        await Promise.all(options.filesChanged.map(async file => {
            const projectFile = await project.getFile(file.path);
            await projectFile.setContent(file.content);
        }));
    }
    if (!!options.filesDeleted) {
        await Promise.all(options.filesDeleted.map(async file => {
            await project.deleteFile(file);

        }));
    }
    await project.commit("testing");
    const postStatus = await project.gitStatus();
    return {
        id: project ? project.id as RemoteRepoRef : new GitHubRepoRef("my", "test"),
        push: {
            id: new Date().getTime() + "_",
            branch: "master",
            commits: [
                {
                    sha: postStatus.sha,
                }],
            after: {
                sha: postStatus.sha,
                message: "Some fake commit",
            },
            before: {
                sha: preStatus.sha,
            },
        },
        project,
        context: fakeContext(),
        addressChannels: AddressNoChannels,
        configuration: {},
        preferences: NoPreferenceStore,
        credentials: { token: "fake-token" },
    };
}

/**
 * Atomist SDM Sample
 * @description Demonstrates how to create a goal that has a project listener
 * @tag listener
 * @instructions <p>Now that the SDM is up and running, make a commit to a repository
 *               that has:
 *               <ul>
 *                   <li>an Atomist webhook configured</li>
 *                   <li>is a NodeJS project with Typescript files</li>
 *                   <li>has a script called "compile" that calls <code>tsc<code></li>
 *               </ul>
 *               You can observe the goal from chat or https://app.atomist.com.</p>
 */

import {
    allSatisfied,
    execPromise,
    GoalProjectListenerEvent,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import { Build } from "@atomist/sdm-pack-build";
import {
    IsNode,
    IsTypeScript,
    nodeBuilder,
} from "@atomist/sdm-pack-node";

export const configuration = configure(async () => {
    const npmBuild = new Build().with({
        builder: nodeBuilder({command: "npm", args: ["run", "compile"]}),
    });

    /***
     * Run NPM install before executing the goal to resolve dependencies. A goal is always run against a clean
     * checkout of a project, so unless you have the node_modules folder committed in your SCM, this is a
     * necessary step.
     */
    npmBuild.withProjectListener({
        name: "execute npm install",
        events: [GoalProjectListenerEvent.before],
        listener: async p => {
            await execPromise(
                "npm",
                ["install"],
                {
                    cwd: p.baseDir,
                },
            );
            return {
                code: 0,
            };
        },
    });

    return {
        // Define a PushRule that will build a project containing typescript files
        npm_typescript_build: {
            test: allSatisfied(IsNode, IsTypeScript),
            goals: npmBuild,
        },
    };
}, { name: "projectListener" });

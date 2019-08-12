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

/**
 * Atomist SDM Sample
 * @description Example Kubernetes deploy goal
 * @tag goal,kubernetes,deploy
 * @instructions <p>Now that the SDM is up and running, make sure you have a Kubernetes
 *               cluster properly configured and push a commit to a repository
 *               that has an Atomist GitHub App configured. You can observe the goal
 *               from chat or https://app.atomist.com.  The deployment will not spin
 *               up because the image does not exist, but you can see the machinery
 *               in action.</p>
 */

// atomist:code-snippet:start=k8sDeploy
import { GitProject } from "@atomist/automation-client";
import {
    not,
    predicatePushTest,
    pushTest,
    SdmGoalEvent,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import {
    k8sSupport,
    KubernetesApplication,
    KubernetesDeploy,
    KubernetesDeployDataSources,
} from "@atomist/sdm-pack-k8s";

export const configuration = configure(async sdm => {
    // Add core Kubernetes extension pack functionality
    sdm.addExtensionPacks(k8sSupport());
    const sources = [KubernetesDeployDataSources.DeploymentSpec, KubernetesDeployDataSources.Dockerfile];
    // Create Kubernetes deploy goal
    const k8sDeploy = new KubernetesDeploy()
        .with({
            // Configure application
            applicationData: (app, project, goal, event) => appData(app, project, event),
            // Set production cluster
            name: "@atomist/k8s-sdm_production",
            // Select what this fulfillment applies to
            pushTest: isDefaultBranch,
            // Read information from project
            dataSources: sources,
        })
        .with({
            applicationData: (app, project, goal, event) => appData(app, project, event),
            // Set testing cluster
            name: "@atomist/k8s-sdm_testing",
            pushTest: not(isDefaultBranch),
            dataSources: sources,
        });
    // Return goal set
    return {
        deploy: {
            goals: k8sDeploy,
            test: predicatePushTest("IsNpm", async p => !!await p.getFile("package.json")),
        },
    };
});

const isDefaultBranch = pushTest("IsDefaultBranch",
    async pli => pli.push.branch === pli.push.repo.defaultBranch);

async function appData(app: KubernetesApplication, project: GitProject, event: SdmGoalEvent): Promise<KubernetesApplication> {
    const prodDeploy = event.push.branch === event.push.repo.defaultBranch;
    app.ns = prodDeploy ? "production" : event.push.branch;
    const version = JSON.parse(await (await project.getFile("package.json")).getContent()).version;
    const slug = `${event.repo.owner}/${event.repo.name}`;
    app.image = `docker.example.org/${slug}:${version}`;
    app.host = prodDeploy ? "api.example.org" : "api-testing.example.org";
    app.port = 8080;
    const prefix = prodDeploy ? "" : `/${event.push.branch}`;
    app.path = `${prefix}/${slug}(/|$)(.*)`;
    app.ingressSpec = {
        metadata: {
            annotations: {
                "nginx.ingress.kubernetes.io/rewrite-target": "/$2",
            },
        },
    };
    app.serviceAccountSpec = { metadata: { name: "api" } };
    return app;
}
// atomist:code-snippet:end

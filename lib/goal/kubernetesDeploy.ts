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
import { predicatePushTest } from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import {
    k8sSupport,
    KubernetesDeploy,
    KubernetesDeployDataSources,
} from "@atomist/sdm-pack-k8s";

export const configuration = configure(async sdm => {
    // Add core Kubernetes extension pack functionality
    sdm.addExtensionPacks(k8sSupport());
    // Create Kubernetes deploy goal
    const k8sDeploy = new KubernetesDeploy().with({
        // Configure application
        applicationData: async (app, project, goal, event) => {
            app.ns = (event.push.branch === event.push.repo.defaultBranch) ? "production" : "testing";
            const version = JSON.parse(await (await project.getFile("package.json")).getContent()).version;
            const slug = `${event.repo.owner}/${event.repo.name}`;
            app.image = `docker.example.org/${slug}:${version}`;
            app.port = 8080;
            app.path = `/${slug}(/|$)(.*)`;
            app.host = "api.example.org";
            app.ingressSpec = {
                metadata: {
                    annotations: {
                        "nginx.ingress.kubernetes.io/rewrite-target": "/$2",
                    },
                },
            };
            app.serviceAccountSpec = { metadata: { name: "api" } };
            return app;
        },
        // Set cluster
        name: "@atomist/k8s-sdm_testing",
        // Select what this fulfillment applies to
        pushTest: predicatePushTest("IsNpmDocker", async p => !!await p.getFile("package.json") && !!await p.getFile("Dockerfile")),
        // Read information from project
        dataSources: [
            KubernetesDeployDataSources.DeploymentSpec,
            KubernetesDeployDataSources.Dockerfile,
        ],
    });
    // Return goal set
    return {
        deploy: {
            goals: k8sDeploy,
        },
    };
});
// atomist:code-snippet:end

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
 * @description Demonstrates executing a custom GraphQL query
 * @tag command,parameters,graphql
 * @instructions <p>Now that the SDM is up and running, start the sample command handler
 *               from chat or web-app by typing "@atomist start".</p>
 */

import { QueryNoCacheOptions } from "@atomist/automation-client";
import { CommandHandlerRegistration } from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import * as _ from "lodash";
import { BuildStatusBySha } from "../typings/types";

/**
 * Command handler that asks to enter a SHA and which will return the build status of that SHA
 */
const BuildStatusForShaCommand: CommandHandlerRegistration = {
    name: "BuildStatusForSha",
    intent: "start",
    listener: async ci => {

        const params = await ci.promptFor<{ sha: string }>({
            sha: {
                description: "enter a SHA",
            },
        });

        const sha = params.sha;
        // The query for this can be found in lib/graphql/query/BuildStatusBySha.graphql. The build process will generate types
        // for this query, so that you have type safety.
        const builds = await ci.context.graphClient.query<BuildStatusBySha.Query, BuildStatusBySha.Variables>({
            name: "BuildStatusBySha",
            variables: {
                sha,
            },
            options: QueryNoCacheOptions,
        });

        const status = _.get(builds, "Commit[0].builds[0].status");

        if (!!status) {
            await ci.addressChannels(`The status of the build is ${status}`);
        } else {
            await ci.addressChannels(`The SHA ${sha} does not have a build status`);
        }

    },
};

/**
 * Install the command handler into the SDM
 */
export const configuration = configure(async sdm => {
    sdm.addCommand(BuildStatusForShaCommand);

});

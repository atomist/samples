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
    GraphQL,
    Success,
} from "@atomist/automation-client";
import { configure } from "@atomist/sdm-core";
import {
    AddSampleEventMutation,
    AddSampleEventMutationVariables,
} from "../../typings/types";

/**
 * Atomist SDM Sample
 * @description SDM to add a custom event type and send data via mutation
 * @tag sdm,custom-event,event-handler
 * @instructions <p>This sample SDM supports the docs pages on custom events.
 *               Please review the docs page for details on how to interfact with
 *               custom event types using mutations.
 *               </p>
 */

export const configuration = configure(async sdm => {
    sdm.addIngester(GraphQL.ingester({ name: "SampleEvent" }));
    sdm.addCommand({
        name: "create-sample-event",
        intent: "create sample event",
        listener: async ctx => {
            await ctx.addressChannels("Sending custom sample event...");
            const result = await ctx.context.graphClient.mutate<AddSampleEventMutation, AddSampleEventMutationVariables>({
                name: "AddSampleEvent",
                variables: {
                    data: {
                        message: `My new event from ${ctx.context.source.identity}`,
                        timestamp: Date.now().toString(),
                    },
                },
            });

            await ctx.addressChannels(`New event id: ${result.ingestCustomSampleEvent}`);
            return Success;
        },
    });
}, { name: "customEvent-mutation" });

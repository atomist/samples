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

import { GraphQL } from "@atomist/automation-client";
import { configure } from "@atomist/sdm-core";

/**
 * Atomist SDM Sample
 * @description SDM to add a custom event type and send data via curl or webhook
 * @tag sdm,custom-event,event-handler
 * @instructions <p>This sample SDM supports the docs pages on custom events.
 *               Please review the docs page for details on how to interfact with
 *               custom event types via curl or webhook.
 *               </p>
 */

export const configuration = configure(async sdm => {
// atomist:code-snippet:start=AddIngester
    sdm.addIngester(GraphQL.ingester({ name: "SampleEvent" }));
// atomist:code-snippet:end
}, { name: "customEvent" });

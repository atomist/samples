import {GraphQL} from "@atomist/automation-client";
import {configure} from "@atomist/sdm-core";

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
    sdm.addIngester(GraphQL.ingester({ name: "SampleEvent" }));
}, { name: "customEvent" });

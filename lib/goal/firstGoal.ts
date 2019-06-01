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
 * @description Demonstrates how to create a first custom goal
 * @tag goal
 * @instructions Now that the SDM is up and running, make a commit to a repository that has an Atomist webhook configured. You can observe the goal from chat or https://app.atomist.com.
 */

import {
    AnyPush,
    goal,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import * as _ from "lodash";

export const configuration = configure(async () => {

    // Create a first goal using the goal helper function
    const messageGoal = goal(
        {
            displayName: "Message Contributor",

            // Enable the following option; this will require to be started explicitly
            // preApproval: true,
        },
        // Function that gets executed when the goal is ready to run
        async gi => {
            const { goalEvent, context, progressLog } = gi;

            // Carefully get the screenName of the user authoring this push
            const screenName = _.get(goalEvent, "push.after.author.person.chatId.screenName");

            // When Atomist correlated the Git author to a chat identity, this will send a thank you note to the author
            if (!!screenName) {

                // Writing a log message into the progress log which is linked from the goal in chat or web
                progressLog.write(`Sending thank you note to user ${screenName}`);

                await context.messageClient.addressUsers(
                    ":clap: Many thanks for your contribution! :tada:",
                    screenName,
                    { id: "thank_you" }); // Using the same message id will make sure the user only sees one thank you note
            }
        });

    return {
        // Define a PushRule with name 'thank you' that schedules the messageGoal for any push
        thank_you: {
            test: AnyPush,
            goals: messageGoal,
        },
    };
});

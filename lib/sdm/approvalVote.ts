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
    goal,
    GoalApprovalRequestVote,
    slackSuccessMessage,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import {
    codeLine,
    italic,
} from "@atomist/slack-messages";
import * as os from "os";

/**
 * Atomist SDM Sample
 * @description SDM to demonstrate custom goal approval voting
 * @tag sdm,vote
 * @instructions <p>Now that the SDM is up and running, make a commit to any
 *               repository that has an Atomist webhook configured. You can observe
 *               the Message goal from chat or https://app.atomist.com.
 *
 *               Note: You can configure which user should be allowed to approve
 *               the goal by setting the ATOMIST_USER environment variable.</p>
 */

const AllowedUserName = process.env.ATOMIST_USER || os.userInfo().username;

/**
 * Main entry point into the SDM
 */
export const configuration = configure(async sdm => {

    sdm.addGoalApprovalRequestVoter(async garvi => {
        if (garvi.goal.preApproval.userId !== AllowedUserName) {
            return {
                vote: GoalApprovalRequestVote.Denied,
                reason: `Only ${AllowedUserName} is allowed to approve goals`,
            };
        } else {
            return {
                vote: GoalApprovalRequestVote.Granted,
            };
        }
    });

    const messageGoal = goal({
        displayName: "Message",
        preApproval: true,
    }, async gi => {
        const { goalEvent } = gi;
        await gi.context.messageClient.addressUsers(
            slackSuccessMessage(
                "Goal Approval",
                `You pre-approved goal ${italic(goalEvent.name)} on ${codeLine(goalEvent.sha.slice(0, 7))}`),
            gi.goalEvent.preApproval.userId);
    });

    return {
        greeting: {
            goals: messageGoal,
        },
    };
});

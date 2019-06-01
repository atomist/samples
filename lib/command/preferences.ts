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
 * @description Demonstrates a command handler that sets and deletes SDM preferences
 * @tag command,parameters
 * @instructions Now that the SDM is up and running, start the sample command handler from chat or web-app by typing "@atomist store fact".
 */

import {
    CommandHandlerRegistration,
    ParameterStyle,
    PreferenceScope,
    slackInfoMessage,
    slackSuccessMessage,
    slackWarningMessage,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import { codeLine } from "@atomist/slack-messages";

/**
 * Command handler that stores a fact in the SDM preferences
 */
const StoreFactCommand: CommandHandlerRegistration<{ fact: string }> = {
    name: "StoreFact",
    intent: "store fact",
    description: "Command to store a fact in SDM preferences",
    parameters: {
        fact: {},
    },
    parameterStyle: ParameterStyle.Dialog,
    autoSubmit: true,
    listener: async ci => {
        await ci.preferences.put<string>("sample.fact", ci.parameters.fact, { scope: PreferenceScope.Sdm });
        await ci.addressChannels(
            slackSuccessMessage(
                "Stored Fact",
                "You can now get or delete the fact via '@atomist get fact' or '@atomist delete fact'."));
    },
};

/**
 * Command handler that gets a fact from the SDM preferences
 */
const GetFactCommand: CommandHandlerRegistration = {
    name: "GetFact",
    intent: "get fact",
    description: "Command to get a fact from the SDM preferences",
    listener: async ci => {
        const fact = await ci.preferences.get<string>("sample.fact", { scope: PreferenceScope.Sdm });
        if (!!fact) {
            await ci.addressChannels(
                slackInfoMessage(
                    "Stored Fact",
                    `Stored fact is ${codeLine(fact)}. You can now delete the fact via '@atomist delete fact'.`));
        } else {
            await ci.addressChannels(
                slackWarningMessage(
                    "Stored Fact",
                    `No fact stored. You can store a fact via '@atomist store fact'.`,
                    ci.context));
        }
    },
};

/**
 * Command handler that deletes a fact from the SDM preferences
 */
const DeleteFactCommand: CommandHandlerRegistration = {
    name: "DeleteFact",
    intent: "delete fact",
    description: "Command to delete a fact from the SDM preferences",
    listener: async ci => {
        const fact = await ci.preferences.delete("sample.fact", { scope: PreferenceScope.Sdm });
        await ci.addressChannels(
            slackInfoMessage(
                "Stored Fact",
                `Stored fact deleted!`));
    },
};

/**
 * Install the command handler into the SDM
 */
export const configuration = configure(async sdm => {

    sdm.addCommand(StoreFactCommand);
    sdm.addCommand(GetFactCommand);
    sdm.addCommand(DeleteFactCommand);

});

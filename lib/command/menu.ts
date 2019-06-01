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
 * @description Demonstrates using menus in chat
 * @tag command,parameters
 * @instructions Now that the SDM is up and running, start the sample command handler from chat or web-app by typing "@atomist start".
 */

import {
    actionableMenu,
    CommandHandlerRegistration,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import { SlackMessage } from "@atomist/slack-messages";

/**
 * Command handler that sends a message to chat containing a simple selection menu
 */
const SelectColorCommand: CommandHandlerRegistration = {
    name: "SelectColor",
    intent: "start",
    listener: async ci => {

        const msg: SlackMessage = {
            attachments: [{
                text: "Please select a color",
                fallback: "Please select a color",
                actions: [
                    actionableMenu({
                            text: "Color",
                            options: [
                                { text: "Blue", value: "blue" },
                                { text: "Red", value: "red" },
                                { text: "Yellow", value: "yellow" },
                            ],
                        },
                        RespondWithColorCommand,
                        "color"),
                ],
            }],
        };

        await ci.addressChannels(msg);
    },
};

/**
 * Command handler that receives the color parameter from the menu
 */
const RespondWithColorCommand: CommandHandlerRegistration<{ color: string }> = {
    name: "RespondWithColor",
    parameters: {
        color: { required: true },
    },
    listener: async ci => {
        await ci.addressChannels(`You selected '${ci.parameters.color}'`);
    },
};

/**
 * Install the two command handlers into the SDM
 */
export const configuration = configure(async sdm => {

    sdm.addCommand(SelectColorCommand);
    sdm.addCommand(RespondWithColorCommand);

});

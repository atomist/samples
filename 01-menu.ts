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
    actionableMenu,
    CommandHandlerRegistration,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import { SlackMessage } from "@atomist/slack-messages";

const CommandTriggeredFromMenu: CommandHandlerRegistration<{ color: string }> = {
    name: "CommandTriggeredFromMenu",
    parameters: {
        color: { required: true },
    },
    listener: async ci => {
        await ci.addressChannels(`You selected '${ci.parameters.color}'`);
    },
};

const MenuCreatingCommand: CommandHandlerRegistration = {
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
                        CommandTriggeredFromMenu,
                        "color"),
                ],
            }],
        };

        await ci.addressChannels(msg);
    },
}

export const configuration = configure(async sdm => {

    sdm.addCommand(CommandTriggeredFromMenu);
    sdm.addCommand(MenuCreatingCommand);
    
});

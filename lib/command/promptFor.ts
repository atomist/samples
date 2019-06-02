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
 * @description Demonstrates using promptFor to acquire parameters
 * @tag command,parameters
 * @instructions <p>Now that the SDM is up and running, start the sample command handler
 *               from chat or web-app by typing "@atomist start".</p>
 */

import { CommandHandlerRegistration } from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";

/**
 * Command handler that asks for more parameters during execution using
 * promptFor.
 */
const SelectColorCommand: CommandHandlerRegistration = {
    name: "SelectColor",
    intent: "start",
    listener: async ci => {

        const params = await ci.promptFor<{ color: string }>({
            color: {
                description: "enter your favorite color", type: {
                    options: [
                        { description: "Blue", value: "blue" },
                        { description: "Red", value: "red" },
                        { description: "Yellow", value: "yellow" }],
                },
            },
        });

        await ci.addressChannels(`You selected '${params.color}'`);

    },
};

/**
 * Install the command handler into the SDM
 */
export const configuration = configure(async sdm => {

    sdm.addCommand(SelectColorCommand);

});

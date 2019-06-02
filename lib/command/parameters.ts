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
 * @description Demonstrates a command handler with parameters
 * @tag command,parameters
 * @instructions <p>Now that the SDM is up and running, start the sample command handler
 *               from chat or web-app by typing "@atomist hello".</p>
 */

import { MappedParameters } from "@atomist/automation-client";
import {
    CommandHandlerRegistration,
    DeclarationType,
    ParametersDefinition,
    ParameterStyle,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import { user } from "@atomist/slack-messages";

interface GreetingParameters {
    name: string;
    firstName?: string;

    screenName: string;
}

const GreetingParametersDefinition: ParametersDefinition<GreetingParameters> = {

    // Declare two parameters the users invoking the command will be asked to enter
    name: { required: true, description: "Name of the person to greet" },
    firstName: { required: false, description: "First name of the person to greet" },

    // MappedParameters are parameters that the platform resolves from the current invocation
    // context eg. the screen name of the user invoking the command
    screenName: { uri: MappedParameters.SlackUserName, declarationType: DeclarationType.Mapped },
};

/**
 * Command handler that sends a greeting message to the #general channel
 */
const GreetingCommand: CommandHandlerRegistration<GreetingParameters> = {
    name: "Greeting",
    intent: "hello",
    description: "Command to send a greeting message out",
    parameters: GreetingParametersDefinition,
    parameterStyle: ParameterStyle.Dialog,
    autoSubmit: true,
    listener: async ci => {
        await ci.context.messageClient.addressChannels(
            `Hello ${!!ci.parameters.firstName ?
                `${ci.parameters.firstName} ${ci.parameters.name}` : ci.parameters.name} from ${user(ci.parameters.screenName)}`, "general");
    },
};

/**
 * Install the command handler into the SDM
 */
export const configuration = configure(async sdm => {

    sdm.addCommand(GreetingCommand);

});

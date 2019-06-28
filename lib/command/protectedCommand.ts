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
 * @description Demonstrates a command handler that is protected by a security check
 * @tag command,parameters
 * @instructions <p>Now that the SDM is up and running, start the sample command handler
 *               from chat or web-app by typing "@atomist show token".
 *
 *               Note: You can configure which user should be allowed to access
 *               the underlying command by setting the ATOMIST_USER environment
 *               variable.</p>
 */

import { MappedParameters } from "@atomist/automation-client";
import {
    CommandHandlerRegistration,
    CommandListenerInvocation,
    DeclarationType,
    ParametersDefinition,
    slackErrorMessage,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import { italic } from "@atomist/slack-messages";
import * as os from "os";
import {
    CredentialsParameters,
    TokenCommand,
} from "./secrets";

const AllowedUserName = process.env.ATOMIST_USER || os.userInfo().username;

export interface UserIdParameters {
    userId: string;
}

export const UserIdParametersDefinition: ParametersDefinition<UserIdParameters> = {
    userId: { uri: MappedParameters.SlackUserName, declarationType: DeclarationType.Mapped },
};

/**
 * Wraps the provided command with an access control check
 *
 * This sample checks the userId against AllowedUserName, but the logic
 * can be changed to check LDAP permissions or make other API calls.
 */
function securedCommand<T>(check: (ci: CommandListenerInvocation<T & UserIdParameters>) => Promise<boolean>,
                           cmd: CommandHandlerRegistration<T>): CommandHandlerRegistration<any> {
    return {
        name: `Secured${cmd.name}`,
        ...cmd,
        parameters: {
            ...cmd.parameters,
            ...UserIdParametersDefinition,
        },
        listener: async ci => {
            if (await check(ci)) {
                return cmd.listener(ci);
            } else {
                return ci.addressChannels(
                    slackErrorMessage(
                        "Access Denied",
                        `Access to command ${italic(cmd.name)} denied`,
                        ci.context,
                    ),
                );
            }
        },
    };
}

/**
 * Install the command handler into the SDM
 */
export const configuration = configure(async sdm => {

    sdm.addCommand(
        securedCommand<CredentialsParameters>(
            async ci => ci.parameters.userId === AllowedUserName,
            TokenCommand,
        ));

});

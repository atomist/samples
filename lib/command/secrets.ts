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
 * @description Demonstrates a command handler with secrets
 * @tag command,parameters
 * @instructions <p>Now that the SDM is up and running, start the sample command handler
 *               from chat or web-app by typing "@atomist show token".</p>
 */

import { Secrets } from "@atomist/automation-client";
import { replacer } from "@atomist/automation-client/lib/internal/util/string";
import {
    DeclarationType,
    ParametersDefinition,
    slackInfoMessage,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import { codeLine } from "@atomist/slack-messages";
import * as stringify from "json-stringify-safe";

interface CredentialsParameters {
    token: string;
}

const CredentialsParametersDefinition: ParametersDefinition<CredentialsParameters> = {
    token: { uri: Secrets.userToken("repo"), declarationType: DeclarationType.Secret },
};

/**
 * Install the command handler into the SDM
 */
export const configuration = configure(async sdm => {

    sdm.addCommand({
        name: "TokenCommand",
        intent: "show token",
        parameters: CredentialsParametersDefinition,
        listener: async ci => {
            await ci.addressChannels(
                slackInfoMessage(
                    "Token",
                    `We have the following token recorded for you:

${codeLine(stringify(ci.credentials, replacer))}`));
        },
    });

});

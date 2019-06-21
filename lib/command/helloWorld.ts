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
 * @description Demonstrates a "hello world" command handler
 * @tag command
 * @instructions <p>Now that the SDM is up and running, start the sample command handler
 *               from chat or web-app by typing "@atomist hello".</p>
 */

// tslint:disable:no-duplicate-imports

// atomist:code-snippet:start=helloWorldCommand
import { NoParameters } from "@atomist/automation-client";
import { CommandListenerInvocation } from "@atomist/sdm";

export async function helloWorldListener(ci: CommandListenerInvocation<NoParameters>): Promise<void> {
    return ci.addressChannels("Hello, world");
}
// atomist:code-snippet:end

// atomist:code-snippet:start=helloWorldCommandRegistration
import { CommandHandlerRegistration } from "@atomist/sdm";



export const helloWorldCommand: CommandHandlerRegistration = {
    name: "HelloWorld",
    description: "Responds with a friendly greeting to everyone",
    intent: "hello",
    listener: async ci => {
        await ci.addressChannels("Hello, world");
        return { code: 0 };
    },
};
// atomist:code-snippet:end

import { configure } from "@atomist/sdm-core";
/**
 * Install the command handler into the SDM.
 * Usually you'll do this in your `lib/machine.ts`
 * (this SDM is different because it combines many samples)
 */
export const configuration = configure(async sdm => {

    // atomist:code-snippet:start=helloWorldCommandAdd
    sdm.addCommand(helloWorldCommand);
    // atomist:code-snippet:end

});

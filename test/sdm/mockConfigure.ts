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
    Configuration,
    ConfigurationPostProcessor,
    Maker,
} from "@atomist/automation-client";
import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { HandleEvent } from "@atomist/automation-client/lib/HandleEvent";
import {
    AbstractSoftwareDeliveryMachine,
    DefaultGoalImplementationMapper,
    Goal,
    GoalSetter,
    PushListenerInvocation,
    SoftwareDeliveryMachine,
} from "@atomist/sdm";
import * as sdmCore from "@atomist/sdm-core";
import { convertGoalData } from "@atomist/sdm-core/lib/machine/configure";
import * as mockery from "mockery";

export function mockConfigure(): void {
    mockery.enable();
    mockery.warnOnUnregistered(false);
    mockery.warnOnReplace(false);

    const mockSdmCore = {
        ...sdmCore,
        configure: async (configurer: sdmCore.Configurer<any>, options: {
            name?: string,
            postProcessors?: ConfigurationPostProcessor | ConfigurationPostProcessor[],
        } & sdmCore.ConfigureOptions) => {

            const sdm = new TestSoftwareDeliveryMachine(options.name || "Test SDM");

            const configured = await configurer(sdm);

            if (Array.isArray(configured)) {
                sdm.withPushRules(configured[0], ...configured.slice(1));
            } else if (!!configured) {
                const goalContributions = convertGoalData(configured);
                sdm.withPushRules(goalContributions[0], ...(goalContributions.slice(1) || []));
            }

            return { sdm };
        },
    };
    mockery.registerMock("@atomist/sdm-core", mockSdmCore);
}

export function unmockConfigure(): void {
    mockery.deregisterAll();
    mockery.disable();
}

export async function createSdm(index: string): Promise<SoftwareDeliveryMachine> {
    const config = require(index).configuration;
    return (await config).sdm as SoftwareDeliveryMachine;
}

export async function planGoals(sdm: SoftwareDeliveryMachine, pli: PushListenerInvocation): Promise<Goal[]> {
    const mappingGoals = await sdm.pushMapping.mapping(pli);
    if (mappingGoals === undefined) {
        return [];
    }
    return mappingGoals.goals;
}

class TestSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    public readonly commandHandlers: Array<Maker<HandleCommand>>;
    public readonly eventHandlers: Array<Maker<HandleEvent<any>>>;
    public readonly goalFulfillmentMapper: DefaultGoalImplementationMapper;
    public readonly ingesters: string[];

    constructor(name: string, ...goalSetters: Array<GoalSetter | GoalSetter[]>) {
        super(name, {
            // Pass in just enough config for adding listeners not to blow up
            sdm: {} as any,
            listeners: undefined,
        }, goalSetters);
    }
}

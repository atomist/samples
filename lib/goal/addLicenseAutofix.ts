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
 * @description Shows how to use the Autofix goal
 * @tag goal,autofix
 * @instructions <p>Now that the SDM is up and running, make a commit to a repository
 *               that has an Atomist webhook configured. You can observe the goal
 *               from chat or https://app.atomist.com.</p>
 */

import { PullRequest } from "@atomist/automation-client/lib/operations/edit/editModes";
import {
    Autofix,
    AutofixRegistration,
    formatDate,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import {
    AddLicenseCodeTransform,
    Licenses,
} from "../transform/addLicense";

/**
 * AutofixRegistration for the exiting AddLicenseCodeTransform
 *
 * This autofix will always supply 'aslv2 as license parameter to the code transform.
 */
const AddLicenseAutofixRegistration: AutofixRegistration<{ license: string }> = {
    name: "LICENSE",
    parametersInstance: { license: "aslv2" },
    transform: AddLicenseCodeTransform,
};

export const configuration = configure(async () => {

    // Create new autofix goal will push changes to a new branch and raise a PR
    const autofix = new Autofix({
        transformPresentation: () => new PullRequest(
            `license-autofix-${formatDate()}`,
            `Add ${Licenses.aslv2.label} license file`),
    }).with(AddLicenseAutofixRegistration);

    return {
        // Define a PushRule with name 'fix' that schedules the autofix for any push
        fix: {
            goals: autofix,
        },
    };
}, {name: "licenseautofix"});

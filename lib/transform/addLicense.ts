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
 * @description Shows a code transform that adds a license ile into the repository
 * @tag command,preferences
 * @instructions Now that the SDM is up and running, start the sample code transform from chat or web-app by typing "@atomist add license file".
 * @test transform/addLicense.test.ts
 */

import { HttpMethod } from "@atomist/automation-client";
import { PullRequest } from "@atomist/automation-client/lib/operations/edit/editModes";
import {
    CodeTransform,
    CodeTransformRegistration,
    formatDate,
} from "@atomist/sdm";
import { configure } from "@atomist/sdm-core";
import * as _ from "lodash";

/**
 * Some sample license information
 */
export const Licenses: Record<string, { label: string, link: string }> = {
    aslv2: {
        label: "Apache v2",
        link: "https://www.apache.org/licenses/LICENSE-2.0.txt",
    },
    eplv2: {
        label: "Eclise Public License v2",
        link: "https://www.eclipse.org/org/documents/epl-2.0/EPL-2.0.txt",
    },
    gplv3: {
        label: "GNU Public License v3",
        link: "https://www.gnu.org/licenses/gpl-3.0.txt",
    },
};

export const AddLicenseCodeTransform: CodeTransform<{ license: string }> =
    async (p, papi) => {
        // Download the license text using the SDM's http client abstraction
        const license = Licenses[papi.parameters.license];
        const licenseTxt = (await papi.configuration.http.client.factory.create(license.link)
            .exchange<string>(license.link, { method: HttpMethod.Get })).body;

        // Check if the transform can create a new or has to update an existing license file
        if (await p.hasFile("LICENSE")) {
            const licenseFile = await p.getFile("LICENSE");
            await licenseFile.setContent(licenseTxt);
        } else {
            await p.addFile("LICENSE", licenseTxt);
        }

        return p;
    };

/**
 * Code Transform that downloads and adds a license text file to the root of a repository
 */
export const AddLicenseFile: CodeTransformRegistration<{ license: string }> = {
    name: "AddLicenseFile",
    intent: "add license file",
    description: "Code transform to add license files into a repository",
    parameters: {
        license: {
            type: {
                options: _.map(Licenses, (v, k) => ({ description: v.label, value: k })),
            },
        },
    },
    // Main transform logic to download and add the license file
    transform: AddLicenseCodeTransform,
    // Transform presentation controls how the changes are pushed back to repo
    // Here we transform will create a new PullRequest
    transformPresentation: (papi, p) => new PullRequest(
        `license-transform-${papi.parameters.license}-${formatDate()}`,
        `Add ${Licenses[papi.parameters.license].label} license file`),
};

export const configuration = configure(async sdm => {

    sdm.addCodeTransformCommand(AddLicenseFile);

});

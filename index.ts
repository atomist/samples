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

import { Configuration } from "@atomist/automation-client";
import * as fs from "fs-extra";
import * as inquirer from "inquirer";
import * as path from "path";

async function loadSdm(): Promise<Configuration> {

    const samples = (await fs.readdir(__dirname))
        .filter(f => f.endsWith(".ts") && !f.endsWith("index.ts") && !f.endsWith(".d.ts"));

    const questions: inquirer.Question[] = [
        {
            type: "list",
            name: "sample",
            message: "Please select a sample SDM from the following list",
            choices: samples.map(s => ({ name: s, value: s })),
        },
    ];

    const answers = await inquirer.prompt(questions);
    return require(path.join(__dirname, answers.sample.replace(".ts", ".js"))).configuration;
}

export const configuration = loadSdm();

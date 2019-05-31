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
    configureLogging,
    logger,
    PlainLogging,
} from "@atomist/automation-client";
import * as fs from "fs-extra";
import * as glob from "glob";
import * as inquirer from "inquirer";
import * as path from "path";

const DescriptionRegexp = new RegExp(/\* @description (.*)/, "g");

async function loadSdm(): Promise<Configuration> {

    const samples = glob.sync("**/*.ts", { nodir: true, ignore: ["node_modules/**", "test/**", "index.ts"] }).map(f => {
        const content = fs.readFileSync(f).toString();
        DescriptionRegexp.lastIndex = 0;
        const match = DescriptionRegexp.exec(content);
        if (!!match) {
            return {
                name: f,
                description: match[1],
            };
        } else {
            return undefined;
        }
    }).filter(s => !!s);

    const questions: inquirer.Question[] = [
        {
            type: "list",
            name: "sample",
            message: "Samples",
            choices: samples.map(s => ({ name: `${s.name} - ${s.description}`, value: s.name })),
        },
    ];

    configureLogging(PlainLogging);
    logger.info(`
Welcome to the Atomist SDM samples repository! 

Please start an SDM sample by selecting one of the files in the menu below.
`);
    const answers = await inquirer.prompt(questions);
    return require(path.join(__dirname, answers.sample.replace(".ts", ".js"))).configuration;
}

export const configuration = loadSdm();

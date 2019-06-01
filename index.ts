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
    AutomationClient,
    AutomationEventListenerSupport,
    Configuration,
    configureLogging,
    logger,
    PlainLogging,
} from "@atomist/automation-client";
import * as boxen from "boxen";
import chalk from "chalk";
import * as fs from "fs-extra";
import * as glob from "glob";
import * as inquirer from "inquirer";
import * as path from "path";

const DescriptionRegexp = new RegExp(/\* @description (.*)/, "g");
const InstructionsRegexp = new RegExp(/\* @instructions (.*)/, "g");

async function loadSdm(): Promise<Configuration> {

    const samples = glob.sync("**/*.ts", { nodir: true, ignore: ["node_modules/**", "test/**", "index.ts"] }).map(f => {
        const content = fs.readFileSync(f).toString();
        DescriptionRegexp.lastIndex = 0;
        InstructionsRegexp.lastIndex = 0;
        const descriptionMatch = DescriptionRegexp.exec(content);

        let instructions: string;
        const instructionsMatch = InstructionsRegexp.exec(content);
        if (!!instructionsMatch) {
            instructions = instructionsMatch[1];
        }

        if (!!descriptionMatch) {
            return {
                name: f,
                description: descriptionMatch[1],
                instructions,
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
            choices: samples.map(s => ({ name: `${s.name} - ${s.description}`, value: s })),
        },
    ];

    configureLogging(PlainLogging);
    logger.info(boxen(`${chalk.yellow.bold("Welcome to the Atomist SDM samples repository")}

Please start an SDM sample by selecting one of the files in the menu below.`, { padding: 1 }));
    const answers = await inquirer.prompt(questions);
    const cfg = require(path.join(__dirname, answers.sample.name.replace(".ts", ".js"))).configuration;
    if (!!answers.sample.instructions) {
        cfg.listeners = [
            ...(cfg.listeners || []),
            new InstructionsPrintingAutomationEventListener(answers.sample.name, answers.sample.instructions),
        ];
    }
    return cfg;
}

export const configuration = loadSdm();

class InstructionsPrintingAutomationEventListener extends AutomationEventListenerSupport {

    constructor(private readonly name: string, private readonly instructions: string) {
        super();
    }

    public async startupSuccessful(client: AutomationClient): Promise<void> {
        const wrap = require("wordwrap")(75);
        const url = `\n\nView source code for this SDM at:\n   https://github.com/atomist/samples/blob/master/${this.name}`;
        logger.info(`\n${boxen(chalk.yellow(wrap(this.instructions)) + url, { padding: 1 })}`);
    }
}

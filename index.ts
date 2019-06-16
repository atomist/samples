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
import * as _ from "lodash";
import * as path from "path";

const DescriptionRegexp = new RegExp(/\* @description (.*)/, "g");
const InstructionsRegexp = new RegExp(/\* @instructions <p>([\s\S]*)<\/p>/, "gm");

async function loadSdm(): Promise<Configuration> {
    const allTypeScriptSourceFiles = glob.sync("**/*.ts", { nodir: true, ignore: ["**/*.d.ts", "node_modules/**", "test/**", "index.ts"] })
    const samples = _.sortBy(allTypeScriptSourceFiles.map(describeSdmSourceFile).filter(s => !!s), "name");

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
    const sdm = answers.sample;
    const cfg = require(path.join(__dirname, sdm.name.replace(".ts", ".js"))).configuration;
    if (!!answers.sample.instructions) {
        cfg.listeners = [
            ...(cfg.listeners || []),
            new InstructionsPrintingAutomationEventListener(sdm.name, sdm.instructions),
        ];
    }

    // Put the name of the sample into the registration name
    const name = sdm.name.split("/").slice(1).join("/").replace(".ts", "");
    cfg.name = `@atomist/samples-${name.toLowerCase()}`;

    return cfg;
}

export const configuration = loadSdm();

class InstructionsPrintingAutomationEventListener extends AutomationEventListenerSupport {

    constructor(private readonly name: string, private readonly instructions: string) {
        super();
    }

    public async startupSuccessful(client: AutomationClient): Promise<void> {
        let text = this.instructions.replace(/\*/g, "").replace(/ +(?= )/g, "");
        text = text.split("\n").map(t => t.trim()).join("\n");

        const url = `\n\nView source code for this SDM at:\n   https://github.com/atomist/samples/blob/master/${this.name}`;
        logger.info(`\n${boxen(chalk.yellow(text) + url, { padding: 1 })}`);
    }
}

interface SdmSourceFile {
    name: string,
    description?: string,
    instructions?: string
}

function firstMatchContent(regex: RegExp, str: string): string | undefined {
    regex.lastIndex = 0;
    const instructionsMatch = regex.exec(str);
    if (!!instructionsMatch) {
        return instructionsMatch[1];
    }
    return undefined;
}

function describeSdmSourceFile(relativePath: string): SdmSourceFile | undefined {
    const content = fs.readFileSync(relativePath).toString();
    const descriptionMatch = firstMatchContent(DescriptionRegexp, content);
    if (!descriptionMatch) {
        return undefined;
    }

    return {
        name: relativePath,
        description: descriptionMatch,
        instructions: firstMatchContent(InstructionsRegexp, content),
    };
}
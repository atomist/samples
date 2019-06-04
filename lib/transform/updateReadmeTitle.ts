import { SeedDrivenGeneratorParameters } from "@atomist/automation-client";
import { CodeTransform } from "@atomist/sdm";

/**
 * Update the title of the README.md with the name of the new repository
 */
export const UpdateReadmeTitle: CodeTransform<SeedDrivenGeneratorParameters> =
    async (p, ctx, params) => {
        if (await p.hasFile("README.md")) {
            const readmeFile = await p.getFile("README.md");
            const content = await readmeFile.getContent();
            const newContent = content.replace(/^\s*#.*/, `# ${p.id.repo}\n\n${params.target.description}`);
            await readmeFile.setContent(newContent);
        }
        return p;
    };

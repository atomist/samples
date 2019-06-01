import {
    Configuration,
    DefaultHttpClientFactory,
    GitProject,
    InMemoryProject,
} from "@atomist/automation-client";
import { CodeTransform } from "@atomist/sdm";
import * as assert from "power-assert";
import {
    AddLicenseCodeTransform,
    AddLicenseFile,
} from "../../lib/transform/addLicense";

describe("AddLicenseCodeTransform", () => {

    const configuration: Configuration = {
        http: {
            client: {
                factory: DefaultHttpClientFactory,
            },
        },
    };

    it("should add new license file", async () => {
        const project = InMemoryProject.from({ owner: "test", repo: "samples" } as any);

        const transformedProject = await AddLicenseCodeTransform(project, {
            configuration,
            parameters: { license: "aslv2" },
        } as any) as GitProject;
        assert(!!(await transformedProject.hasFile("LICENSE")));
        assert((await transformedProject.getFile("LICENSE")).getContentSync().includes("Apache"));
    });

    it("should update license file", async () => {
        const project = InMemoryProject.from({ owner: "test", repo: "samples" } as any, [{ path: "LICENSE", content: "Apache" }] as any);

        const transformedProject = await (AddLicenseFile.transform as CodeTransform)(project, {
            configuration,
            parameters: { license: "gplv3" },
        } as any) as GitProject;
        assert(!!(await transformedProject.hasFile("LICENSE")));
        assert(!(await transformedProject.getFile("LICENSE")).getContentSync().includes("Apache"));
        assert(!!(await transformedProject.getFile("LICENSE")).getContentSync().includes("GNU"));
    });

});

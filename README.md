# @atomist/samples

[![npm version](https://img.shields.io/npm/v/@atomist/samples.svg)](https://www.npmjs.com/package/@atomist/samples)
[![atomist sdm goals](https://badge.atomist.com/T29E48P34/atomist/samples/5f6a382b-a284-4918-9635-349c70d2a3b4)](https://app.atomist.com/workspace/T29E48P34)

This repository is the home of very small sample Atomist Software
Delivery Machines. 

Each TypeScript file in `/lib` showcases a certain feature of the SDM
framework and the Atomist platform.

Software delivery machines enable you to control your delivery process
in code.  Think of it as an API for your software delivery.  See the
[Atomist documentation][atomist-doc] for more information on the
concept of a software delivery machine and how to create and develop
an SDM.

[atomist-doc]: https://docs.atomist.com/ (Atomist Documentation)

## Samples

Here is a list of all the samples in this repository:

<!---atomist:sample=start--->
|Name|Description|Tags|
|----|-----------|----|
|[`lib/command/menu.ts`](lib/command/menu.ts)|Demonstrates using menus in chat|command, parameters|
|[`lib/command/parameters.ts`](lib/command/parameters.ts)|Demonstrates a command handler with parameters|command, parameters|
|[`lib/command/preferences.ts`](lib/command/preferences.ts)|Demonstrates a command handler that sets and deletes SDM preferences|command, preferences|
|[`lib/command/promptFor.ts`](lib/command/promptFor.ts)|Demonstrates using promptFor to acquire parameters|command, parameters|
|[`lib/goal/addLicenseAutofix.ts`](lib/goal/addLicenseAutofix.ts)|Shows how to use the Autofix goal|autofix, goal|
|[`lib/goal/firstGoal.ts`](lib/goal/firstGoal.ts)|Demonstrates how to create a first custom goal|goal|
|[`lib/sdm/dotnetCore.ts`](lib/sdm/dotnetCore.ts)|SDM to create and build .NET Core projects|dotnet-core, generator, sdm|
|[`lib/sdm/jenkinsJob.ts`](lib/sdm/jenkinsJob.ts)|SDM to demonstrate how to run and converge Jenkins jobs|jenkins, maven, sdm|
|[`lib/transform/addLicense.ts`](lib/transform/addLicense.ts)|Shows a code transform that adds a license ile into the repository|command, preferences|
<!---atomist:sample=end--->

Refer to the following section on how to run any of those samples 
from your own machine.

## Running

### Prerequisites 

Before you can run any of the samples from this repository you need
to install the Atomist CLI. Please follow [Developer Quick Start][atomist-quick] 
to set up your environment.

[atomist-quick]: https://docs.atomist.com/quick-start/ (Atomist - Developer Quick Start)

### Starting a Sample

Once the Atomist CLI is installed, you run any of the examples by simply 
typing the following into your terminal:

```
$ atomist start --repository-url=https://github.com/atomist/samples.git
```

This command will start a selection menu from which you can select one 
of the available samples to start.

Alternatively you can also start a sample directly by running:

```
$ atomist start --repository-url=https://github.com/atomist/samples.git --index=<SAMPLE>
```

Running this command requires you replace the placeholder `<SAMPLE>`
with a name of one of the sample SDM programs in the root of this repository.
For example `--index=lib/command/menu.ts`.

If you feel like changing some of the samples, you can also clone or fork
this repository and then run the samples with:

```
$ atomist start
```

## Contributing

Contributions to this project from community members are encouraged
and appreciated. Please review the [Contributing
Guidelines](CONTRIBUTING.md) for more information. Also see the
[Development](#development) section in this document.

## Code of conduct

This project is governed by the [Code of
Conduct](CODE_OF_CONDUCT.md). You are expected to act in accordance
with this code by participating. Please report any unacceptable
behavior to code-of-conduct@atomist.com.

## Documentation

Please see [docs.atomist.com][atomist-doc] for
[developer][atomist-doc-sdm] documentation.

[atomist-doc-sdm]: https://docs.atomist.com/developer/sdm/ (Atomist Documentation - SDM Developer)

## Connect

Follow [@atomist][atomist-twitter] and [the Atomist blog][atomist-blog].

[atomist-twitter]: https://twitter.com/atomist (Atomist on Twitter)
[atomist-blog]: https://blog.atomist.com/ (The Official Atomist Blog)

## Support

General support questions should be discussed in the `#support`
channel in the [Atomist community Slack workspace][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist-seeds/empty-sdm/issues

## Development

You will need to install [Node.js][node] to build and test this
project.

[node]: https://nodejs.org/ (Node.js)

### Build and test

Install dependencies.

```
$ npm install
```

Use the `build` package script to compile, test, lint, and build the
documentation.

```
$ npm run build
```

### Release

Releases are handled via the [Atomist SDM][atomist-sdm].  Just press
the 'Approve' button in the Atomist dashboard or Slack.

[atomist-sdm]: https://github.com/atomist/atomist-sdm (Atomist Software Delivery Machine)

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ (Atomist - How Teams Deliver Software)
[slack]: https://join.atomist.com/ (Atomist Community Slack)

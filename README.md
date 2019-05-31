# @atomist/samples

[![npm version](https://img.shields.io/npm/v/@atomist/samples.svg)](https://www.npmjs.com/package/@atomist/samples)
[![atomist sdm goals](https://badge.atomist.com/T29E48P34/atomist/samples/5f6a382b-a284-4918-9635-349c70d2a3b4)](https://app.atomist.com/workspace/T29E48P34)

This repository is the home of very small sample Atomist Software
Delivery Machines. Each TypeScript file in the root of this 
repository show-cases a certain feature of the SDM framework and
the Atomist platform.

Software delivery machines enable you to control your delivery process
in code.  Think of it as an API for your software delivery.  See the
[Atomist documentation][atomist-doc] for more information on the
concept of a software delivery machine and how to create and develop
an SDM.

[atomist-doc]: https://docs.atomist.com/ (Atomist Documentation)


## Running the Samples

Before you can run any of the samples from this repository you need
to install the Atomist CLI. Please follow [Developer Quick Start][atomist-quick] 
to set up your environment.

Once the Atomist CLI is installed, you run any of the examples by simply 
typing the following into your terminal:

```
$ atomist start --repository-url=https://github.com/atomist/samples.git --index=<SAMPLE_FILE>
```

Running this command requires you replace the placeholder `<SAMPLE_FILE>`
with a name of one of the sample SDM programs in the root of this repository.

Alternatively you can also clone this repository and then run the samples with:

```
$ atomist start
```

Here is a list of possible samples you can run:

|Name|Description|
|----|-----------|
|01-menu.ts|Demonstrates the usage of Command handlers to send Slack messages with menus|
|02-promptFor.ts|Demonstrates the usage of `promptFor` to ask for more parameters|

[atomist-quick]: https://docs.atomist.com/quick-start/ (Atomist - Developer Quick Start)

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

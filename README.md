# Update Hubspot on Org Creation Event

I'm the project who updates Genoox CRM (Hubspot) with Franklin registered user \ org details
I'm deployed as an AWS CDK, which is created by a convienent open source serveless stack framework (SST)

Good to know about me:

```
./lib - My Configuration file, which region to deploy, how is the stack configured
├── MyStack.ts 
└── index.ts
```

```
./src - The lambda source code
├── hubspot
├── lambda.ts
└── utils.ts
```



More to learn in the guide below on SST methods (Test, Deploy, Remove resources)
# Getting Started with Serverless Stack (SST)

This project was bootstrapped with [Create Serverless Stack](https://docs.serverless-stack.com/packages/create-serverless-stack).

Start by installing the dependencies.

```bash
$ npm install
```

## Commands

### `npm run start`

Starts the local Lambda development environment.

### `npm run build`

Build your app and synthesize your stacks.

Generates a `.build/` directory with the compiled files and a `.build/cdk.out/` directory with the synthesized CloudFormation stacks.

### `npm run deploy [stack]`

Deploy all your stacks to AWS. Or optionally deploy a specific stack.

### `npm run remove [stack]`

Remove all your stacks and all of their resources from AWS. Or optionally remove a specific stack.

### `npm run test`

Runs your tests using Jest. Takes all the [Jest CLI options](https://jestjs.io/docs/en/cli).

## Documentation

Learn more about the Serverless Stack.

- [Docs](https://docs.serverless-stack.com)
- [@serverless-stack/cli](https://docs.serverless-stack.com/packages/cli)
- [@serverless-stack/resources](https://docs.serverless-stack.com/packages/resources)

## Community

[Follow us on Twitter](https://twitter.com/ServerlessStack) or [post on our forums](https://discourse.serverless-stack.com).

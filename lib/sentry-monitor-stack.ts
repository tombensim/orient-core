import * as sst from "@serverless-stack/resources";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";

export class SentryMonitorStack extends sst.Stack {
    constructor(scope: sst.App, id: string, props?: sst.StackProps) {
        super(scope, id, props);
        const sentry = LayerVersion.fromLayerVersionArn(this, "SentryLayer", `arn:aws:lambda:${scope.region}:943013980633:layer:SentryNodeServerlessSDK:34`);
        if (!scope.local) {
            this.addDefaultFunctionLayers([sentry]);
            this.addDefaultFunctionEnv({
                SENTRY_DSN: "https://7321e8a51f8b47d2a2f7c6ecebf37c50@o1123220.ingest.sentry.io/6160918",
                NODE_OPTIONS: "-r @sentry/serverless/dist/awslambda-auto"
            });
        }
    }
}
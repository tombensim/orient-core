import * as iam from 'aws-cdk-lib/aws-iam';
import * as sst from "@serverless-stack/resources";
import ServiceUpdaterStack from "./service-updater-stack";
import CommunityManagerStack from "./community-manager-stack";
import BIDataStack from './bi-data-stack';
import { TestStack } from './tests-stack';
import { SEToolsStack } from './se-tools-stack';
export default function main(app: sst.App): void {
  // Set default runtime for all functions

  app.setDefaultFunctionProps({
    runtime: "nodejs14.x",
    timeout: 60,
    environment: {
      SECRET_STORE_NAME: 'marketing/services',
      STAGE: app.stage,
    },
    permissions: [

      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        effect: iam.Effect.ALLOW,
        resources: [
          "arn:aws:secretsmanager:eu-west-1:626868674493:secret:*",
        ],
      }),
    ]
  }
  );


  new ServiceUpdaterStack(app, "service-updater");
  new CommunityManagerStack(app, "community-manager");
  new BIDataStack(app, "bi-data");
  new TestStack(app, "0tests");
  new SEToolsStack(app, "se-tools");

  // Add more stacks
}

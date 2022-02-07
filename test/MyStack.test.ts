import { expect, haveResource } from "@aws-cdk/assert";
import * as sst from "@serverless-stack/resources";
import ServiceUpdaterStack from './../lib/service-updater-stack'

test("Test Stack", () => {
  const app = new sst.App();
  // WHEN
  const stack = new ServiceUpdaterStack(app, "test-stack");
  console.log("HERE")
  console.log(JSON.stringify(stack.urlSuffix))
  console.log(stack.toJsonString(stack.urlSuffix))
  
  
  // THEN
  expect(stack).to(haveResource("AWS::Lambda::Function"));
});

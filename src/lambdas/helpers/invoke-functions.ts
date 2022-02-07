import { APIGatewayProxyEventV2 } from "aws-lambda";
import { wrapAWSHandler, OrientContext } from "../../../lib/utils/lambda-wrapper";
import AWS = require("aws-sdk");
import { parseEvent } from "../../commons/utils";


interface EventProps {
    FunctionName: string,
    invokeParams: any
}

export const handler = wrapAWSHandler({
    initServices: []
},
    async (event: APIGatewayProxyEventV2, context: OrientContext) => {
        const eventBody:EventProps = parseEvent(event)
        // lists all aws lambda functions
        const result = await new AWS.Lambda().invokeAsync({FunctionName:eventBody.FunctionName, InvokeArgs:eventBody.invokeParams}).promise();

        return {
                statusCode: 200,
                body: JSON.stringify(
                    result
                )
            };
        },

        );

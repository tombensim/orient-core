import { APIGatewayProxyEventV2 } from "aws-lambda";
import { wrapAWSHandler, OrientContext } from "../../../lib/utils/lambda-wrapper";
import AWS = require("aws-sdk");


export const handler = wrapAWSHandler({
    initServices: []
},
    async (event: APIGatewayProxyEventV2, context: OrientContext) => {

        // lists all aws lambda functions
        const lambdas = await new AWS.Lambda().listFunctions({}).promise();

        return {
            statusCode: 200,
            body: JSON.stringify(
                lambdas
            )
        };
    },

);

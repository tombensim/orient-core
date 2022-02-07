---
to: src/lambdas/<%=h.changeCase.headerCase(name).toLowerCase()%>/<%=h.changeCase.headerCase(name).toLowerCase()%>.ts
---

import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEvent } from "../../commons/utils";
import { wrapAWSHandler, OrientContext } from "../../../lib/utils/lambda-wrapper";

// Used to describe the event that triggered the function
type EventProps = {
    textProp: string,
    json: any
}

export const handler = wrapAWSHandler({
    initServices: []
},
    async (event: APIGatewayProxyEventV2, context: OrientContext) => {
    
        return {
                statusCode: 200,
                body: JSON.stringify(
                    event.body
                )
            };
        },

        );


---
to: lib/stacks/<%=h.changeCase.headerCase(name).toLowerCase()%>-stack.ts
---
import * as sst from "@serverless-stack/resources";
import { Function } from "@serverless-stack/resources";
import { SentryMonitorStack } from "./sentry-monitor-stack";


export class <%=h.changeCase.pascalCase(name)%> extends SentryMonitorStack {
    constructor(scope: sst.App, id: string, props?: sst.StackProps) {
        super(scope, id, props);
        const <%=name%> = new Function (this, "<%=h.changeCase.snakeCase(name)%>", {
            description: "CHANGE ME",
            handler: "src/lambdas/<%=h.changeCase.headerCase(name).toLowerCase()%>/<%=h.changeCase.headerCase(name).toLowerCase()%>.handler",
        
        });

        // you can use hygen stack add (name) to add lambdas to your stack
        this.addOutputs({
            Stage: scope.stage,
        });
    }
}

---
inject: true
to: lib/index.ts
after: import * as sst from "@serverless-stack/resources";
---

import <%=h.changeCase.pascalCase( name )%> from "./<%=name%>-stack";
---
inject: true
to: lib/index.ts
after: // Add more stacks
---

  new <%=h.changeCase.pascalCase(name)%>(app, "<%=h.changeCase.headerCase(name).toLowerCase()%>");
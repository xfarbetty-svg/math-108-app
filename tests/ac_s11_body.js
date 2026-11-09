// tests/ac_s11_body.js
await new Promise(r => setTimeout(r, 800));
const rep = window.__acReport;
if (!rep) return ["FAIL ac_report :: window.__acReport 未生成"];
return rep.details;

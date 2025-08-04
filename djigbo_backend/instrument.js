// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
const Sentry = require("@sentry/node");

Sentry.init({
    dsn: "https://c24c23c6598d55aab49bd9fc5604b8d1@o4504626835619840.ingest.us.sentry.io/4509787781726208",

    // Send structured logs to Sentry
    enableLogs: true,

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});
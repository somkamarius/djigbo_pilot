// No-op logger - doesn't log anywhere
const logger = {
  info: () => { },
  error: () => { },
  warn: () => { },
  debug: () => { },
  verbose: () => { },
  silly: () => { }
};

module.exports = logger;

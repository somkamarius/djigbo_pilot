const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const esTransportOpts = {
  level: 'info',
  index: 'an-index',
  clientOpts: {
    node: 'http://elasticsearch:9200',
  },
  transformer: logData => {
    return {
      "@timestamp": (new Date()).getTime(),
      severity: logData.level,
      message: `[${logData.level}] LOG Message: ${logData.message}`,
      fields: {}
    }
  }
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logfile.log', level: 'error' }), // Save errors to file
    new ElasticsearchTransport(esTransportOpts) // Use ElasticsearchTransport instead of Elasticsearch
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ // Log to console if not in production
    format: winston.format.simple()
  }));
}

module.exports = logger;

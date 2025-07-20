const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({ node: 'http://localhost:9200' }); // Adjust as needed

module.exports = esClient; 
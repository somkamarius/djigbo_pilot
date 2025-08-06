// Environment variable checker for debugging
console.log('Environment Variable Check:');
console.log('==========================');

const requiredVars = [
    'TOGETHER_API_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'BEDROCK_MODEL_ID',
    'OLLAMA_MODEL'
];

console.log('\nRequired Environment Variables:');
requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 10)}... (${value.length} chars)`);
    } else {
        console.log(`❌ ${varName}: NOT SET`);
    }
});

console.log('\nOptional Environment Variables:');
const optionalVars = [
    'SUMMARY_PROVIDER',
    'NODE_ENV',
    'PORT'
];

optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${value}`);
    } else {
        console.log(`⚠️  ${varName}: NOT SET (using default)`);
    }
});

console.log('\nSentry Configuration:');
console.log(`SENTRY_DSN: ${process.env.SENTRY_DSN ? 'SET' : 'NOT SET'}`);
console.log(`SENTRY_ENVIRONMENT: ${process.env.SENTRY_ENVIRONMENT || 'NOT SET'}`);

console.log('\nAuth0 Configuration:');
console.log(`AUTH0_AUDIENCE: ${process.env.AUTH0_AUDIENCE ? 'SET' : 'NOT SET'}`);
console.log(`AUTH0_ISSUER_BASE_URL: ${process.env.AUTH0_ISSUER_BASE_URL ? 'SET' : 'NOT SET'}`); 
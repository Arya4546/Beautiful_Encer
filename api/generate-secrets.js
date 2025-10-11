// Generate secure random secrets for environment variables
import crypto from 'crypto';

console.log('=== Copy these to your Render Environment Variables ===\n');
console.log('JWT_ACCESS_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('\n=== End of secrets ===');

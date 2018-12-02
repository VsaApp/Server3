import crypto from 'crypto';

const config = require('../config.json');
config.usernamesha = crypto.createHash('sha256').update(config.username).digest('hex');
config.passwordsha = crypto.createHash('sha256').update(config.password).digest('hex');

export default config;
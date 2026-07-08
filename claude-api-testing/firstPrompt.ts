import * as dotenv from 'dotenv';

dotenv.config( { path: './config.env' });

const apiKey = process.env.ANTHROPIC_API_KEY;

if (apiKey) {
    console.log('Key: ' + apiKey);
} else {
    console.log(':(');
}
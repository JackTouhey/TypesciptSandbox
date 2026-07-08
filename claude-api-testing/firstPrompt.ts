import * as dotenv from 'dotenv';
import Anthropic from "@anthropic-ai/sdk";

dotenv.config( { path: './config.env' });

const apiKey = process.env.ANTHROPIC_API_KEY;

const client = new Anthropic();

async function submitPrompt(input: string) {
    const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: input
            }
        ]
    });

    console.log(response);
} 

submitPrompt("This is a test to see if I now have programatic access to claude");
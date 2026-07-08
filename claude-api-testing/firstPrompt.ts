import * as dotenv from 'dotenv';
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config( { path: './config.env' } );

type Message = {
    role: "user" | "assistant";
    content: any;
} 

const client = new Anthropic();
const fileToUpload = process.env.UPLOAD_PATH;

async function submitPrompt(messages: Message[]) {
    const response = await client.beta.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        betas: ["code-execution-2025-08-25", "files-api-2025-04-14"],
        tools: [{ type: "code_execution_20250825", name: "code_execution" }],
        messages: messages
    });

    console.log(response);
} 

function createMessage(isUser: boolean, content: any): Message {
    return {
        role: isUser ? "user" : "assistant",
        content: content
    };
}

function createMessagePair(assistantMessage: any, userMessage: any): Message[] {
    return [
        createMessage(false, assistantMessage),
        createMessage(true, userMessage)
    ];
}

async function uploadFile(filePath: string): Promise<string> {
    const uploaded = await client.beta.files.upload({
        file: fs.createReadStream(filePath),
    });
    console.log(uploaded);
    return uploaded.id; 
}

const messages: Message[] = [];


console.log(process.env.CV_FILEID);

// messages.push(createMessage(true, ));

// submitPrompt(messages);
import * as dotenv from 'dotenv';
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config( { path: './config.env' } );

type Message = {
    role: "user" | "assistant";
    content: any[];
} 

const client = new Anthropic();
const fileToUpload: string = process.env.UPLOAD_PATH !== undefined ? process.env.UPLOAD_PATH : "";
const cvFileId = process.env.CV_FILEID !== undefined ? process.env.CV_FILEID : "";
const messages: Message[] = [];

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

function addFileToMessage(message: Message, fileId: string) {
    message.content.push({ type: "container_upload", file_id: fileId });
} 

async function uploadFile(filePath: string): Promise<string> {
    const uploadedFile = await client.beta.files.upload({
        file: fs.createReadStream(filePath)
    });
    console.log(uploadedFile);
    return uploadedFile.id !== undefined ? uploadedFile.id : "id was not string :("; 
}




async function run() {
    // const fileId = await uploadFile(fileToUpload);
    // console.log(fileId);
    // console.log("------------------------------------")
    const textContent = "Read me the contents of the file with the fileId in the container_upload"; 
    const message: Message = createMessage(true, [{ type: "text", text: textContent }]);
    addFileToMessage(message, cvFileId);
    messages.push(message);
    submitPrompt(messages);
}

run()


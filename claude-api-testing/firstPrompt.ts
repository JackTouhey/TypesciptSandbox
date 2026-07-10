import * as dotenv from 'dotenv';
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config( { path: './config.env' } );

type Message = {
    role: "user" | "assistant";
    content: any[];
} 

const client = new Anthropic();
const uploadPath: string = process.env.UPLOAD_PATH !== undefined ? process.env.UPLOAD_PATH : "";
const downloadPath = process.env.DOWNLOAD_PATH !== undefined ? process.env.DOWNLOAD_PATH : "";
const messages: Message[] = [];
const fileIds: string[] = [
    process.env.CV_FILEID !== undefined ? process.env.CV_FILEID : "",
    process.env.JOB_DESCRIPTION_ID !== undefined ? process.env.JOB_DESCRIPTION_ID : "",
    process.env.CL1 !== undefined ? process.env.CL1 : "",
    process.env.CL2 !== undefined ? process.env.CL2 : "",
    process.env.CL3 !== undefined ? process.env.CL3 : "", 
    process.env.CL4 !== undefined ? process.env.CL4 : "",
    process.env.CL5 !== undefined ? process.env.CL5 : "",
    process.env.CL6 !== undefined ? process.env.CL6 : "",
    process.env.CL7 !== undefined ? process.env.CL7 : "",
    process.env.CL8 !== undefined ? process.env.CL8 : "",
    process.env.CL9 !== undefined ? process.env.CL9 : "",
    process.env.CL10 !== undefined ? process.env.CL10 : "",
    process.env.CL11 !== undefined ? process.env.CL11 : "",
    process.env.CL12 !== undefined ? process.env.CL12 : "",
    process.env.CL13 !== undefined ? process.env.CL13 : "",
    process.env.CL14 !== undefined ? process.env.CL14 : "",
]


async function submitPrompt(messages: Message[]) {
    const response = await client.beta.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 5000,
        betas: ["code-execution-2025-08-25", "files-api-2025-04-14"],
        tools: [{ type: "code_execution_20250825", name: "code_execution" }],
        messages: messages
    });

    console.log(response);
    console.log('------------------------------');

    for (const block of response.content) {
        if (block.type === 'bash_code_execution_tool_result') {
            const codeExecutionContent = block.content;
            if (codeExecutionContent.type === 'bash_code_execution_result') {
                for (const generatedFile of codeExecutionContent.content) {
                    const fileId = generatedFile.file_id;
                    console.log("extracted fileId: " + fileId);
                    return fileId;
                }
            }
        }
    }
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

async function downloadFile(fileId: string) {
    const response = await client.beta.files.download(fileId);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(downloadPath + "/" + fileId, buffer);
}


async function run() {
    const textContent = "The fileIds attached are cover letters and a cv. Use this to learn my writing style and write a cover letter for the job listing to a docx file"; 
    const message: Message = createMessage(true, [{ type: "text", text: textContent }]);

    fileIds.forEach((fileId: string) => {
        addFileToMessage(message, fileId);
    });
    // addFileToMessage(message, await uploadFile(uploadPath));

    messages.push(message);
    const generatedFileId = await submitPrompt(messages);

    if (generatedFileId !== undefined) {
        downloadFile(generatedFileId);
    }
}

run();
// downloadFile();

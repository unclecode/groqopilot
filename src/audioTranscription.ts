import OpenAI from "openai";
import * as fs from 'fs';
import * as os from 'os';
import path from "path";

export async function extractTextFromAudio(audioPath: string, apiKey: string) {
    const openai = new OpenAI({
        apiKey: apiKey,
    });
    try {
        const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: 'whisper-1',
        });

        return response.text;
    } catch (error) {
        console.error('Failed to transcribe audio:', error);
        throw error;
    } finally {
        fs.unlinkSync(audioPath);
    }
}
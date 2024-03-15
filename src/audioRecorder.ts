import * as fs from 'fs';
import * as os from 'os';
import path from "path";
import * as record from 'node-record-lpcm16';

export class AudioRecorder {
    private audioRecorder: any;
    private audioPath: string = '';

    public startRecording() {
        return new Promise((resolve, reject) => {
            this.audioPath = path.join(os.tmpdir(), `recording_${Date.now()}.wav`);
            const writeStream = fs.createWriteStream(this.audioPath);

            this.audioRecorder = record.record({
                sampleRate: 16000,
                channels: 1,
                audioType: 'wav',
                threshold: 0.5,
                verbose: true,
            });

            this.audioRecorder.stream().pipe(writeStream);

            writeStream.on('finish', () => {
                resolve(this.audioPath);
            });

            writeStream.on('error', (error: any) => {
                reject(error);
            });
        });
    }

    public stopRecording(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.audioRecorder) {
                this.audioRecorder.stop();
                resolve(this.audioPath);
            } else {
                reject(new Error('Recording not started'));
            }
        });
    }

    public cleanup() : Promise<void> {
        return new Promise((resolve, reject) => {
            fs.unlink(this.audioPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
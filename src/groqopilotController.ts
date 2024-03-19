import * as vscode from 'vscode';
const Groq = require("groq-sdk");
import * as marked from 'marked';


export class GroqopilotController {
    private readonly _extensionUri: vscode.Uri;
    private _apiKey: string | undefined;
    private _sessions: { [key: string]: { messages: Message[] } } = {};
    private _activeSessionId: string = '';
    private _context: vscode.ExtensionContext;
    private _settings: Record<string, any> = {};
    private client: any = null;

    constructor(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._extensionUri = extensionUri;
        this._context = context;
        this._loadSessions();
        this._settings = this._context.globalState.get<Record<string, any>>('groqopilotSettings') || {};
        this.setSettings(this._settings);
    }

    public setSettings(settings: Record<string, any>) {
        this._settings = settings;
        this._context.globalState.update('groqopilotSettings', settings);
        this._apiKey = settings.api_key?.value;

        // Add default keys to settings: "System Prompt"
        if (!this._settings.api_key) {
            this._settings.api_key = { "type": "password", "value": this._context.globalState.get<string>('groqopilotApiKey') || "" };
        }

        if (!this._settings.whisper_api_key) {
            this._settings.whisper_api_key = { "type": "password", "value": this._context.globalState.get<string>('groqopilotWhisperApiKey') || "" };
        }


        // Add default keys to settings: "System Prompt"
        if (!this._settings.system_prompt) {
            this._settings.system_prompt = { "type": "text", "value": "You are a programming assistant helping me to write code." };

        }
        // Add "temprature" to settings and default value is 0.2
        if (!this._settings.temperature) {
            this._settings.temperature = { "type": "number", "value": 0.2 };
        }
        // Add "models" and values are "Mixtral8x7b", "Llama70b", "Gemma:7b", for this value type os enum
        if (!this._settings.model) {
            this._settings.model = { "type": "enum", "value": ["llama2-70b-4096", "mixtral-8x7b-32768", "gemma-7b-it"], "selected": "mixtral-8x7b-32768" };
        }
        if (!this._settings.rerank) {
            this._settings.rerank = { "type": "boolean", "value": false, "description": "Generate multiple responses and re-rank them to get the best response." };
        }

        // Add "stream" to settings and default value is false
        // if (!this._settings.stream) {
        //     this._settings.stream = { "type": "boolean", "value": false };
        // }


        if (this._apiKey)
            this.client = new Groq({
                apiKey: this._apiKey
            });


    }

    public getSettings(): Record<string, any> {
        return this._settings;
    }

    private _loadSessions() {
        const sessions = this._context.globalState.get<Record<string, any>>('groqopilotSessions');

        // Those sessions thaat has no messages, remove them and save the sessions
        // if (foundEmotySession) {
        //     this._sessions = sessions ?? {};
        //     this._saveSessions();
        // }

        if (sessions) {
            this._sessions = sessions;
        }
    }

    private _saveSessions() {
        // do not save the session if it has no messages
        const sessions = this._sessions;
        this._context.globalState.update('groqopilotSessions', sessions);
    }

    private clearEmptySessions() {
        // do not save the session if it has no messages
        const sessions = this._sessions;
        let foundEmotySession = false;
        for (const session in sessions) {
            if (sessions[session].messages.length === 0) {
                delete sessions[session];
                foundEmotySession = true;
            }
            else {
                // iterate through the messages if they don't have the attributes dateTimestamp and readableDateAndTime, add them, set it today a random time before current time
                sessions[session].messages.forEach((message: Message) => {
                    if (!message.dateTimestamp || !message.readableDateAndTime) {
                        message.dateTimestamp = new Date().getTime() - Math.floor(Math.random() * 1000000);
                        message.readableDateAndTime = new Date(message.dateTimestamp).toLocaleString();
                    }
                });
            }
        }
    }


    public async sendMessage(message: string, context: string = ""): Promise<any> {
        if (!this._apiKey) {
            vscode.window.showErrorMessage('API key not set. Please configure the API key in the settings.');
            return // { role: 'assistant', content: 'API key not set. Please configure the API key in the settings.' };
        }

        if (!this._activeSessionId) {
            this._activeSessionId = this.createNewSession();
        }

        let message_context = message;
        if (context) {
            message_context = `${context}\n\nUse above context to get the result for the following query (I need concice and right to the point answer, less explanation, unless it requested in the following query):\n\n${message}`;
        }

        // Get all current messages of session.
        let currentMessages = this._sessions[this._activeSessionId].messages;


        // check if in setting "rerank" is set to true, then call the reRank function if not call the callAPI function
        let result = null;
        if (this._settings.rerank.value)
            result = await this.reRank(message_context, currentMessages, 5, 3);
        else
            result = await this.callAPI(message_context, currentMessages);

        // // const result = await this.callAPI(message_context, currentMessages);
        // const result = await this.reRank(message_context, currentMessages, 5, 3);
        if (result.status === 'success') {
            const response = result.data;
            const formatedResponse = await marked.parse(response);
            const userFormatedContent = await marked.parse(message);
            const dateTimestamp = new Date().getTime();
            const readableDateAndTime = new Date().toLocaleString();
            this._sessions[this._activeSessionId].messages.push({
                role: 'user',
                content: message,
                "context": context,
                formatedContent: userFormatedContent,
                dateTimestamp,
                readableDateAndTime
            });
            this._sessions[this._activeSessionId].messages.push({
                role: 'assistant',
                content: response,
                formatedContent: formatedResponse,
                dateTimestamp,
                readableDateAndTime
            });

            this._saveSessions();

            return result
        }
        else {
            vscode.window.showErrorMessage('Error: ' + result.message);
            return result
        }
    }

    public async editMessage(sessionId: string, messageIndex: number, newContent: string) {
        if (this._sessions[sessionId] && this._sessions[sessionId].messages[messageIndex]) {
            try {
                this._sessions[sessionId].messages[messageIndex].formatedContent = await marked.parse(newContent);
                this._sessions[sessionId].messages[messageIndex].content = newContent;
                this._saveSessions();
                return this._sessions[sessionId].messages[messageIndex];
            } catch (error) {
                console.error('Error parsing markdown:', error);
            }
        }
    }

    public async deleteMessage(sessionId: string, messageIndex: number) {
        if (this._sessions[sessionId]) {
            this._sessions[sessionId].messages.splice(messageIndex, 1);
            this._saveSessions();
        }
    }

    public createNewSession(): string {
        this.clearEmptySessions();
        const sessionId = `session_${Date.now()}`;
        this._sessions[sessionId] = { messages: [] };
        this._activeSessionId = sessionId;
        this._saveSessions();
        return sessionId;
    }

    public getSessions(): [string, Record<string, any>][] {
        const items = Object.entries(this._sessions);
        return items;
    }

    public getSessionMessages(sessionId: string): Message[] {
        return this._sessions[sessionId]?.messages || [];
    }

    public loadSession(sessionId: string) {
        this._activeSessionId = sessionId;
    }

    public deleteSession(sessionId: string): void {
        if (this._sessions[sessionId]) {
            delete this._sessions[sessionId];
            this._saveSessions();
        }
    }

    private async callAPI(message: string, current_messages: Message[], model: string = ""): Promise<any> {
        if (!this.client) {
            return 'Client is not initialized';
        }
        try {
            // Get today date in short string format
            const today = new Date().toISOString().split('T')[0];
            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are name is Groq, you are an advanced AI coding assistant. You answer and help coding questions come form the user. Some times there is `<context>...</context>` in the user messge, you should use that one to provide the nswer. Alwause be concise and succinct. No need to provide lenghty explanation unless user asks. Do not generate misunfoirmation, if there is somehting you don't know or not sure make sure to share rather than providing wrong information. You are here to help and provide the right information. Another thing is, always when you have to use a framework lik eReact, or FastAPI, make sure to double check the version with users, to avoid confusion. Today date is: " + today
                    },
                    ...current_messages.map(c => ({ role: c.role, content: c.content })),
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: this._settings.temperature.value,
                top_p: 0.9,
                model: (model !== "") || this._settings.model.selected,
            });

            return { status: 'success', data: completion.choices[0].message.content };
        } catch (error: any) {
            if (error && error.message) {
                console.log(error.message)
                return { status: 'error', message: error.message };
            }
            return { status: 'error', message: error?.toString() };
        }
    }


    private async reRank(message: string, current_messages: Message[], N: number, top_k: number): Promise<any> {
        if (!this.client) {
            return 'Client is not initialized';
        }
        try {
            // Call the callAPI function N times to get multiple responses
            const promises = [];
            for (let i = 0; i < Math.floor(N * 1); i++) {
                promises.push(this.callAPI(message, current_messages));
            }
            const results = await Promise.all(promises);
            console.log(results);

            // Extract the response content from each result
            const responses = results.map(result => result.data);
            const uniqueResponses = new Set(responses);
            const finalResponses = Array.from(uniqueResponses);

            // if top_k is greater than the number of unique responses, set top_k to the 40% number of unique responses size
            if (top_k > finalResponses.length) {
                top_k = Math.floor(finalResponses.length * 0.4);
            }

            // Generate the prompt for the LLM to evaluate and select the best responses
            const prompt = `You are an AI assistant tasked with evaluating and selecting the best responses to a user's request. The user's request is:

<context>
${message}
</context>

Here are ${N} responses generated by different programmers to the user's request:

${finalResponses.map((response, index) => `<response index = ${index + 1}>\n${response}\n</response>`).join('\n\n')}

# Task:
Your task is to evaluate these responses and select the top ${top_k} that best address the user's request. Consider factors such as relevance, clarity, and completeness when making your selection.

After selecting the top ${top_k} responses, generate a final response by merging and summarizing the selected responses. Format your output as follows:

**Make sure to wrap the the final answer supposed to be back to user using >>>**

# Example of your response:
After evaluating the responses, I have selected the top <top_k> that best address the user's request. Here they are:

<response index = 1>
summary of response 1

<response index = 2>
summary of response 2

...

<response index = top_k>
summary of response top_k

Based on these top <top_k> responses, I have generated a final response by merging and summarizing them:

>>>
final_response_for_user
>>>`;

            // Call the callAPI function with the generated prompt
            const finalResult = await this.callAPI(prompt, [], "llama2-70b-4096"); //"mixtral-8x7b-32768");

            // Extract the final response from the finalResult
            const finalResponse = finalResult.data.match(/>>>([\s\S]*?)>>>/)[1].trim();

            return { status: 'success', data: finalResponse };
        } catch (error: any) {
            if (error && error.message) {
                console.log(error.message);
                return { status: 'error', message: error.message };
            }
            return { status: 'error', message: error?.toString() };
        }
    }

}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    context?: string;
    formatedContent?: string;
    dateTimestamp?: number;
    readableDateAndTime?: string;
    sessionId?: string;
}


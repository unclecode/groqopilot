# Groqopilot VSCode Extension

![GroqoPilot](https://res.cloudinary.com/kidocode/image/upload/v1714062326/output_s7a9gh.gif)

Groqopilot is a Visual Studio Code extension that integrates Llama3, and Groq, a high-speed inference engine, into your coding environment. Driven by the desire to use Groq everywhere, I built this for myself, hoping it can help others too.

## Groqopilot v0.83: Contextual File & URL Attachments! 🚀

Excited to announce two new features in Groqopilot for VS Code!

1️⃣ Mention any file from your workspace with `@src/app.js` to fetch its content into your chat context.ß

2️⃣ Link an URL with `@https://docs.phidata.com/introduction` to include its content in your conversation.

👉 Check this post for more details: [Groqopilot v0.83: Contextual File & URL Attachments! 🚀](https://x.com/unclecode/status/1795467593471652276?s=46&t=J1hebTqzIYxu8ZpV-7GoyQ)

## Features

- **Chat Interface**: Like Copilot, but with only some essential features.
- **Code Generation**: Interacts with the active editor. Select code, ask a question, and the selection becomes the context for your query. Responses can be inserted or replace the selected text or cursor location.
- **Session Management**: Stores each chat session, letting you review your history and access them.
- **Auto-Completion [Coming Soon]**: Provides suggestions for code completions based on the active editor's context.

## Installation

### Install from the Visual Studio Code Marketplace
1. Open Visual Studio Code.
2. Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X).
3. Search for "Groqopilot" in the Extensions view.
4. Click "Install" and wait for the installation to complete.
5. Restart Visual Studio Code if prompted.

### Install from a VSIX file
1. Download the VSIX file from the latest release on the GitHub repository.
2. Open Visual Studio Code.
3. Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X).
4. Click on the "..." menu in the top-right corner and select "Install from VSIX..."
5. Navigate to the directory where you downloaded the VSIX file and select it.
6. Click "Install" and wait for the installation to complete.
7. Restart Visual Studio Code if prompted.

## Future Plans
- Integration with speech-to-text functionality for voice-based code generation.
- Support for multimodal interaction combining text, voice, and gestures.
- Enhancements to Groq's AI models for more accurate and context-aware suggestions.
- Customizable prompts and templates for streamlined coding workflows.
- Lets users set specific versions of libraries they want to use. I really need this feature myself, and fast!
- Better context-awareness and code generation based on the active editor and the user's coding style.

## Contribution
Groqopilot is an open-source project, and contributions from the community are welcome. If you find this extension useful and would like to contribute to its development and maintenance, please feel free to submit pull requests or open issues on the GitHub repository.

Together, we can continue to improve Groqopilot and make it an essential tool for developers seeking the benefits of fast and efficient inference in their programming tasks. 
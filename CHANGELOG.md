# Change Log

All notable changes to the "groqopilot" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.0] - 2025-07-10

### Summary
- Added full list of current Groq models
- Default model set to `llama-3.3-70b-versatile`
- Fixed model selection logic in API calls
- Updated test script to load Node.js shims for Groq

### Testing
- `npm ci` ✅
- `node scripts/test_groq.js` ❌ *(fails: Connection error)*
- `npm test` ❌ *(fails: SIGSEGV)*

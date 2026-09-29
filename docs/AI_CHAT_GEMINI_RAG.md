# AI chat with Gemini and workspace RAG

The AI chat uses Gemini through the Google `generateContent` API. Set these production variables in Render for the API service:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=<Google AI Studio key>
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEY` is a deployment secret and must not be committed to the repository. Restart or redeploy the API after saving it. `GET /ai-chat/status` then returns `configured: true`, and the chat composer is enabled.

Each chat request builds RAG context from the signed-in user's own tasks, projects, labels, and current schedule. It selects records matching the message keywords, includes at most eight tasks and four projects in the model context, and marks all retrieved text as data rather than instructions. Retrieval queries always include the authenticated `userId`; one user's records cannot be supplied to another user's chat.

The assistant still uses explicit read actions when a request needs a complete list, history, or exact project details. RAG improves relevance; it does not grant write access or bypass task validation.

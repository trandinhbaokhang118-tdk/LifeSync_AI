# AI chat with Gemini and workspace RAG

The AI chat uses Gemini through the Google `generateContent` API. Set these production variables in Render for the API service:

```text
AI_PROVIDER=gemini
GEMINI_CHAT_API_KEY=<dedicated Google AI Studio chat key>
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_CHAT_API_KEY` is a deployment secret and must not be committed to the repository. Add it in the Render API service's Environment settings, then save and redeploy. Keep the existing `GEMINI_API_KEY` for image generation. Chat prefers the dedicated key; if it is absent or blank, it uses `GEMINI_API_KEY` for backward compatibility. `GET /ai-chat/status` returns `configured: true` when a provider key is present; a successful chat request verifies the key's validity and quota.

Each chat request builds RAG context from the signed-in user's own tasks, projects, labels, and current schedule. It selects records matching the message keywords, includes at most eight tasks and four projects in the model context, and marks all retrieved text as data rather than instructions. Retrieval queries always include the authenticated `userId`; one user's records cannot be supplied to another user's chat.

The assistant still uses explicit read actions when a request needs a complete list, history, or exact project details. RAG improves relevance; it does not grant write access or bypass task validation.

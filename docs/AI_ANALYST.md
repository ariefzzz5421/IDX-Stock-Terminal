# AI Analyst configuration

`/ai-analyst` already shows a deterministic, source-linked IDX market brief. It does not need an AI key. The optional AI summary uses a server-side OpenAI-compatible chat-completions endpoint, without a paid SDK.

Add these **server-only** environment variables in Vercel Production and Preview when the chosen provider is ready:

```text
AI_ANALYST_BASE_URL=https://your-provider.example/v1
AI_ANALYST_MODEL=your-model-name
AI_ANALYST_API_KEY=your-secret-key
```

Use the provider's documented HTTPS base URL, model name, and secret. Do not add `NEXT_PUBLIC_` to these names or commit the key to Git. Redeploy after saving the variables. Until all three values are valid, the page continues to show the verified deterministic brief.

The provider receives only a bounded, dated market snapshot: ticker, price, change, and volume. It receives no account profile, watchlist, password, or user-entered prompt. AI text is shown separately from source figures and must not be treated as a verified explanation for a price move. If the provider fails, the source-linked brief stays visible. The scanner is delayed and does not contain company news or trading catalysts.

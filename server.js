// server.js - Express backend proxy for Azure OpenAI (Entra ID auth, new SDK with token provider)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const endpoint = process.env.OPENAI_ENDPOINT;
const apiKey = process.env.OPENAI_API_KEY;

app.post('/api/openai', async (req, res) => {
  try {
    const { messages, functions, temperature, max_tokens } = req.body;
    const body = {
      messages,
      temperature: temperature ?? 0.2,
      max_tokens: max_tokens ?? 512,
    };
    if (functions) {
      body.functions = functions;
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenAI chat request failed');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Azure OpenAI proxy listening on port ${port}`);
});

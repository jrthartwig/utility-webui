export async function fetchOpenAIChatWithAgent(messages: { role: string; content: string }[], functions?: any[]) {
  const endpoint = 'http://localhost:3001/api/openai'; // Proxy to backend
  const body: any = {
    messages,
    temperature: 0.2,
    max_tokens: 512,
  };
  if (functions) {
    body.functions = functions;
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('OpenAI chat request failed');
  const data = await res.json();
  return data;
}

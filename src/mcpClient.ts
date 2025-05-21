// MCP Client utility for context, metadata, and health endpoints
export class MCPClient {
  baseUrl: string;
  apiKey: string | undefined;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async context(lat: number, lon: number) {
    // Use Vite env for API code
    const apiCode = import.meta.env.VITE_FUNCTION_API_CODE;
    const url = `${this.baseUrl}/context?code=${apiCode}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon }),
    });
    if (!res.ok) throw new Error('MCP context request failed');
    return res.json();
  }

  async metadata() {
    const res = await fetch(this.baseUrl.replace('/api/v1', '/api/v1/metadata'));
    if (!res.ok) throw new Error('MCP metadata request failed');
    return res.json();
  }

  async health() {
    const res = await fetch(this.baseUrl.replace('/api/v1', '/api/v1/health'));
    if (!res.ok) throw new Error('MCP health request failed');
    return res.json();
  }
}

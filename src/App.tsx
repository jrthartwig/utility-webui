import { useState } from 'react'
import './App.css'
import { MCPClient } from './mcpClient'
import { fetchOpenAIChatWithAgent } from './openaiSdkClient'

// Remove dotenv import and config from frontend (not supported in browser)
// Use import.meta.env for Vite environment variables

const mcpApiUrl = import.meta.env.VITE_FUNCTION_API_URL;
const mcpApiCode = import.meta.env.VITE_FUNCTION_API_CODE;

if (!mcpApiUrl) {
  throw new Error('MCP API URL is not defined. Please check your .env file and Vite environment variables.');
}

const mcp = new MCPClient(mcpApiUrl);

// Utility function to call MCP server
async function fetchUtilityData(lat: number, lon: number) {
  let endpoint = mcpApiUrl;
  if (mcpApiCode) {
    endpoint += `?code=${mcpApiCode}`;
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon }),
  });
  if (!res.ok) throw new Error('Failed to fetch utility data');
  return res.json();
}

// Define the MCP function/tool for OpenAI function calling
const mcpFunction = {
  name: "get_utility_rates",
  description: "Get utility rates for a given latitude and longitude using the MCP server.",
  parameters: {
    type: "object",
    properties: {
      lat: {
        type: "number",
        description: "Latitude of the location."
      },
      lon: {
        type: "number",
        description: "Longitude of the location."
      }
    },
    required: ["lat", "lon"]
  }
}

function App() {
  const [messages, setMessages] = useState([
    { sender: 'agent', text: 'Hi! Please enter your location or use the button below to detect it.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async (text: string) => {
    setMessages((msgs) => [...msgs, { sender: 'user', text }])
    setLoading(true)
    let chatMessages = [
      { role: 'system', content: 'You are a helpful agent that can answer questions about utility rates. If you need utility data, call the get_utility_rates function.' },
      ...messages.filter(m => m.sender !== 'agent').map(m => ({ role: 'user', content: m.text })),
      { role: 'user', content: text }
    ]
    // Call OpenAI with function/tool support
    let response = await fetchOpenAIChatWithAgent(chatMessages, [mcpFunction])
    const choice = response.choices?.[0]
    // If the model requests a function call
    if (choice?.finish_reason === 'function_call' || choice?.message?.function_call) {
      const functionCall = choice.message.function_call
      if (functionCall?.name === 'get_utility_rates') {
        try {
          const args = JSON.parse(functionCall.arguments)
          const mcpData = await mcp.context(args.lat, args.lon)
          // Send the function response back to the model, but add an instruction to summarize and explain the data
          chatMessages.push({
            role: 'function',
            content: JSON.stringify(mcpData),
            // @ts-ignore
            name: 'get_utility_rates'
          })
          // Add a user message to instruct the agent to ONLY respond with a plain English summary, not the JSON, and to format the answer for a general audience
          chatMessages.push({
            role: 'user',
            content: 'Summarize the utility rates data above in plain English. Do NOT show or mention any JSON or code. Only tell me the provider name and the commercial, industrial, and residential rates in a friendly, readable sentence.'
          })
          // Get the final agent response
          response = await fetchOpenAIChatWithAgent(chatMessages, [mcpFunction])
          const finalMsg = response.choices?.[0]?.message?.content || 'No response.'
          setMessages((msgs) => [
            ...msgs,
            { sender: 'agent', text: finalMsg },
          ])
        } catch (e) {
          setMessages((msgs) => [
            ...msgs,
            { sender: 'agent', text: 'Sorry, failed to fetch utility data.' },
          ])
        } finally {
          setLoading(false)
        }
        return
      }
    }
    // Otherwise, just show the model's response
    setMessages((msgs) => [
      ...msgs,
      { sender: 'agent', text: choice?.message?.content || 'No response.' },
    ])
    setLoading(false)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(input.trim())
      setInput('')
    }
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setMessages((msgs) => [
        ...msgs,
        { sender: 'agent', text: 'Geolocation is not supported by your browser.' },
      ])
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setMessages((msgs) => [
          ...msgs,
          { sender: 'user', text: `My location: ${latitude}, ${longitude}` },
        ])
        try {
          const mcpData = await fetchUtilityData(latitude, longitude)
          // Build chat history for summarization
          let chatMessages = [
            { role: 'system', content: 'You are a helpful agent that can answer questions about utility rates. If you need utility data, call the get_utility_rates function.' },
            { role: 'user', content: `My location: ${latitude}, ${longitude}` },
            {
              role: 'function',
              name: 'get_utility_rates',
              content: JSON.stringify(mcpData)
            },
            {
              role: 'user',
              content: 'Summarize the utility rates data above in plain English. Do NOT show or mention any JSON or code. Only tell me the provider name and the commercial, industrial, and residential rates in a friendly, readable sentence.'
            }
          ]
          const response = await fetchOpenAIChatWithAgent(chatMessages, [mcpFunction])
          const finalMsg = response.choices?.[0]?.message?.content || 'No response.'
          setMessages((msgs) => [
            ...msgs,
            { sender: 'agent', text: finalMsg },
          ])
        } catch (e) {
          setMessages((msgs) => [
            ...msgs,
            { sender: 'agent', text: 'Sorry, failed to fetch utility data.' },
          ])
        } finally {
          setLoading(false)
        }
      },
      () => {
        setMessages((msgs) => [
          ...msgs,
          { sender: 'agent', text: 'Unable to retrieve your location.' },
        ])
        setLoading(false)
      }
    )
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Utility Rates Chat</h1>
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${msg.sender === 'agent' ? 'agent' : 'user'}`}
          >
            <span className="chat-sender">{msg.sender === 'agent' ? 'Agent' : 'You'}:</span>
            <span className="chat-text">{msg.text}</span>
          </div>
        ))}
        {loading && <div className="loading-msg">Loading...</div>}
      </div>
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={input}
          onChange={handleInput}
          placeholder="Type your message or lat,lon..."
          className="chat-input"
          disabled={loading}
        />
        <button type="submit" disabled={loading} className="send-btn">
          Send
        </button>
      </form>
      <button
        onClick={handleDetectLocation}
        disabled={loading}
        className="location-btn"
      >
        Detect My Location
      </button>
    </div>
  )
}

export default App

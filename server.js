const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint to get available models from Ollama
app.get('/api/models', async (req, res) => {
    const ollamaUrl = req.query.serverUrl || 'http://localhost:11434';
    try {
        const response = await axios.get(`${ollamaUrl}/api/tags`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
        try {
            const { message, model, serverUrl } = JSON.parse(data);
            const ollamaUrl = serverUrl || 'http://localhost:11434';

            // Make a streaming request to Ollama
            const response = await axios.post(`${ollamaUrl}/api/generate`, {
                model: model,
                prompt: message,
                stream: true
            }, {
                responseType: 'stream'
            });

            let fullResponse = '';
            response.data.on('data', chunk => {
                       try {
                           // Each chunk is a JSON object with a 'response' field
                           const data = JSON.parse(chunk.toString());
                           if (data.response) {
                               fullResponse += data.response;
                               // Send the chunk to the client
                               ws.send(JSON.stringify({ type: 'chunk', content: data.response }));
                           }
                       } catch (e) {
                           console.error('Error processing chunk:', e);
                       }
                       });

            response.data.on('end', () => {
                // Send completion message
                ws.send(JSON.stringify({ type: 'done', content: fullResponse }));
            });

        } catch (error) {
            console.error('Error in WebSocket message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.response?.data?.error || 'Failed to get response from Ollama'
            }));
        }
    });
});

// Regular HTTP chat endpoint (fallback)
app.post('/api/chat', async (req, res) => {
    const { message, model, serverUrl } = req.body;
    const ollamaUrl = serverUrl || 'http://localhost:11434';
    
    try {
        const response = await axios.post(`${ollamaUrl}/api/generate`, {
            model: model,
            prompt: message,
            stream: false
        });
        
        res.json({ message: { content: response.data.response } });
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({
            error: error.response?.data?.error || 'Failed to get response from Ollama'
        });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
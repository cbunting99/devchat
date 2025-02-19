<img src="screens/Screenshot 2025-02-19 081630.png" width="200" height="200">
<img src="screens/Screenshot 2025-02-19 081703.png" width="200" height="200">
<img src="screens/Screenshot 2025-02-19 081838.png" width="200" height="200">
<img src="screens/Screenshot 2025-02-19 081852.png" width="200" height="200">

# Ollama Chat Interface

A modern web interface for interacting with Ollama language models, featuring real-time chat capabilities and advanced code handling.

## Created Using
This project was written using VSCode and includes the VSCode workspace.

## Features

### Chat Interface
- Clean, modern chat UI with user and AI message distinction
- Real-time message display with markdown support
- Code block syntax highlighting with auto-language detection
- Support for "thinking" tags display
- Loading indicator while AI is generating responses
- Chat history management with date-based grouping
- Ability to save, load, and delete chat sessions
- Copy, edit (for user messages), and regenerate (for AI messages) actions

### Settings Management
- Configurable Ollama server URL
- Dynamic model selection from available Ollama models
- Connection status indicator with real-time checking
- Persistent settings storage using localStorage

### Code Handling
- Advanced code block rendering with syntax highlighting
- Support for multiple programming languages
- Automatic language detection for unmarked code blocks
- Proper handling of both string and object code content
- JSON pretty-printing for object responses
- Improved code highlighting accuracy
- Enhanced markdown formatting with line break support
- Functions to copy code blocks to the clipboard and save them to files

### Server Integration
- Express.js backend with CORS support
- Integration with Ollama API
- Error handling and status reporting
- Support for model listing and chat generation
- Non-streaming mode for complete responses
- WebSocket connection handling for real-time communication

### User Experience
- Responsive design
- Shift + Enter for new lines in input
- Enter to send messages
- Markdown formatting in messages
- Scrollable chat history
- Real-time connection status updates

## Recent Changes
- Added copy, edit (for user messages), and regenerate (for AI messages) actions
- Implemented WebSocket connection handling for real-time communication
- Fixed code block rendering to properly handle object content
- Improved syntax highlighting with language auto-detection
- Enhanced code renderer with proper escaping and formatting
- Added JSON pretty-printing for object responses
- Improved code highlighting accuracy by explicitly specifying language
- Enhanced markdown formatting with line break support

## Technical Stack
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js with Express
- Dependencies:
  - marked (for Markdown rendering)
  - highlight.js (for code syntax highlighting)
  - axios (for API requests)
  - express (for server functionality)

## Setup
1. Ensure Ollama is installed and running locally
2. Install dependencies with `npm install`
3. Start the server in either mode:
   - Production: `node server.js`
   - Development: `npm run dev`
4. Access the chat interface at `http://localhost:3000`

## Development
The project includes a development server with automatic reloading capabilities:
- Uses `nodemon` for automatic server restart
- Watches for changes in `.js`, `.html`, and `.css` files
- Automatically reloads the server when files are modified
- No manual restart required during development
- Run with `npm run dev` to enable auto-reload features

## Configuration
- Default Ollama server URL: `http://localhost:11434`
- Server port: 3000 (configurable via PORT environment variable)
- Settings are stored in browser's localStorage

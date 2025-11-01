# 🤖 AI Resume Chat Bot

An intelligent resume analysis chatbot powered by OpenAI's GPT-4 and embeddings. Upload candidate resumes and project files, then ask AI-powered questions to get detailed insights about their experience, skills, and qualifications.

## ✨ Features

- **📄 File Upload**: Support for `.md` and `.txt` files with drag & drop interface
- **🧠 AI-Powered Analysis**: Uses OpenAI's GPT-4o-mini for intelligent responses
- **🔍 RAG (Retrieval-Augmented Generation)**: Finds relevant information using vector embeddings
- **🎤 Voice Input/Output**: Speech recognition and text-to-speech capabilities
- **💬 Real-time Chat**: Streaming responses with source attribution
- **📱 Responsive Design**: Beautiful UI with Framer Motion animations
- **📚 Complete Tutorial**: Step-by-step guide to build the entire project

## 🚀 Live Demo

Visit the live application: [https://ai-resume-chat-bot.vercel.app](https://ai-resume-chat-bot.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI**: OpenAI GPT-4o-mini, text-embedding-3-small
- **Voice**: Web Speech API
- **Deployment**: Vercel

## 📖 Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AbhiDAL/ai-resume-chat-bot.git
   cd ai-resume-chat-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Add your OpenAI API key to `.env.local`:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📚 Learn to Build It

This repository includes a comprehensive tutorial that teaches you how to build this entire project from scratch!

**Click the "Learn to Build It" button** in the app or visit `/tutorial` to access:

- Complete step-by-step instructions
- All source code with explanations
- Configuration files
- Deployment guide
- Best practices and security tips

## 🎯 How It Works

1. **Upload Files**: Users upload resume and project files in Markdown or text format
2. **Generate Embeddings**: Files are chunked and converted to vector embeddings using OpenAI
3. **Store Vectors**: Embeddings are stored for similarity search
4. **Process Queries**: User questions are converted to embeddings
5. **Find Relevant Content**: Cosine similarity finds the most relevant document chunks
6. **Generate Responses**: GPT-4o-mini generates answers using the retrieved context
7. **Stream Results**: Responses are streamed back to the user with source attribution

## 🔧 API Endpoints

- `POST /api/ask` - Process chat questions and return AI responses
- `POST /api/build-embeddings` - Process uploaded files and generate embeddings

## 📁 Project Structure

```
ai-resume-chat-bot/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── tutorial/      # Tutorial page
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main interface
│   └── lib/               # Core logic
│       ├── embeddings.ts  # Vector operations
│       ├── prompt.ts      # AI prompts
│       ├── retrieve.ts    # Similarity search
│       └── types.ts       # TypeScript types
├── data/                  # Sample files
├── public/               # Static assets
└── config files
```

## 🔐 Security

- API keys are stored in environment variables only
- No hardcoded secrets in the codebase
- GitHub push protection enabled
- Secure file upload handling

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository** to Vercel
2. **Add environment variables** in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `OPENAI_CHAT_MODEL` (optional)
   - `OPENAI_EMBED_MODEL` (optional)
3. **Deploy** - Vercel will automatically build and deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the powerful AI models
- Next.js team for the amazing framework
- Vercel for seamless deployment
- The open-source community for inspiration

## 📞 Support

If you have any questions or need help:

1. Check the [tutorial page](/tutorial) in the app
2. Open an [issue](https://github.com/AbhiDAL/ai-resume-chat-bot/issues)
3. Review the [documentation](https://github.com/AbhiDAL/ai-resume-chat-bot/wiki)

---

**Built with ❤️ by [AbhiDAL](https://github.com/AbhiDAL)**
# AI-Powered-Resume-Chatbot
# AI-Powered-Resume-Chatbot

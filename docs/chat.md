# Chat Flow

## Overview

The chat system is a REST-based customer support AI assistant. No WebSockets — the UI simulates real-time via `aiThinking` Redux flag and a `TypingIndicator`.

---

## Frontend → Backend Flow

### 1. No Active Chat (WelcomeScreen)

```
User clicks suggestion or types in ChatInput
  → handleStartWithMessage(text)
       ├── startNewChat() dispatch
       │     └─ POST /chats  { user_id, organization_id, topic }
       │          └─ createChat.fulfilled → sets activeChat, loading=false
       │
       └── sendWithAI(chatId, userId, text) dispatch
             └─ sendAndReceiveAI thunk
```

### 2. Active Chat (subsequent messages)

```
User types in ChatInput → handleSend(text)
  → sendWithAI(chatId, userId, text)
       └─ sendAndReceiveAI thunk
```

### 3. sendAndReceiveAI thunk (chatSlice.ts)

```
1. dispatch(sendMessage)        POST /messages
     sendMessage.fulfilled → messages.push(userMsg)

2. ChatAPI.sendAI(chatId, text)  POST /chats/ai
     sendAndReceiveAI.fulfilled → messages.push(AI msg)
```

---

## Server-Side AI Processing (POST /chats/ai)

```
chat.controller.js → processAIMessage()
  ├── detectIntent(userMessage)
  │     Returns: "greeting" | "thanks" | "farewell" | "question" | "statement"
  │
  ├── Parallel data fetch:
  │     ├── ragService.hybridQuery()      → vector + keyword search on org docs
  │     ├── memoryService.getRelevantMemories() → long-term user context
  │     └── last 10 messages               → conversation history
  │
  ├── generateAIResponse(context)
  │     ├── Simple intents → canned responses
  │     ├── RAG context    → "Based on docs: ..." + chunks
  │     ├── Memory context → remembered facts
  │     └── Fallback       → keyword routing (account/billing/bug/ticket)
  │
  ├── Message.create({ is_ai: true }) → MongoDB
  └── AISession tracking (message count + tokens)
```

---

## Key Files

### Frontend

| File | Role |
|---|---|
| `src/pages/Customer/ChatPage.tsx` | Page component, orchestrates chat lifecycle |
| `src/components/chat/WelcomeScreen.tsx` | Landing view (suggestions → fill input, ticket btn → /tickets) |
| `src/components/chat/ChatInput.tsx` | Text input with file attachment, `initialValue` prop for suggestions |
| `src/components/chat/ChatMessage.tsx` | Message bubble with markdown rendering |
| `src/components/chat/ChatHeader.tsx` | Header with status indicator + Create Ticket button |
| `src/components/chat/TypingIndigator.tsx` | Typing dots animation |
| `src/hooks/useChat.ts` | Redux dispatch/selector bridge for chat state |
| `src/hooks/useChatScroll.ts` | Auto-scroll to bottom on new messages |
| `src/store/chatSlice.ts` | Redux state: chats, messages, loading, sending, aiThinking |
| `src/api/chat.api.js` | HTTP client: `ChatAPI.sendAI()`, `ChatAPI.create()`, etc. |
| `src/api/message.api.js` | HTTP client: `MessageAPI.send()`, `MessageAPI.getByChat()` |

### Backend

| File | Role |
|---|---|
| `server/modules/chat/chat.route.js` | Routes: `POST /chats`, `POST /chats/ai`, `GET /chats/user/:id` |
| `server/modules/chat/chat.controller.js` | Request handlers |
| `server/modules/chat/chat.service.js` | DB operations on Chat collection |
| `server/modules/chat/aiChat.service.js` | AI response logic (intent + RAG + memory + generation) |
| `server/modules/chat/chat.schema.js` | Mongoose schema for Chat |
| `server/modules/message/message.controller.js` | Message CRUD handlers |
| `server/modules/message/message.service.js` | DB operations on Message collection |
| `server/modules/message/message.schema.js` | Mongoose schema for Message |
| `server/modules/rag/rag.service.js` | Hybrid vector/keyword search on document chunks |
| `server/modules/memory/memory.service.js` | Long-term user memory (facts, preferences) |

---

## State Shape (Redux chatSlice)

```typescript
interface ChatState {
  chats: any[];            // all user chats
  activeChat: any;         // currently selected chat
  messages: any[];         // messages for active chat
  loading: boolean;        // loading chat list
  messagesLoading: boolean; // loading messages
  sending: boolean;        // user message in flight
  aiThinking: boolean;     // AI generating response
  error: string | null;
}
```

---

## Race Condition Guard

`ChatPage.tsx` uses `isCreatingRef` to prevent a race between `loadMessages` (triggered by `useEffect` on `activeChat` change) and `sendWithAI` during the initial message:

```typescript
const isCreatingRef = useRef(false);

useEffect(() => {
  if (activeChat?._id && !isCreatingRef.current) {
    loadMessages(activeChat._id);
  }
}, [activeChat?._id, loadMessages]);

// handleStartWithMessage sets ref = true before dispatching
// and resets to false in finally block
```

Without this guard, `fetchMessages.fulfilled` would overwrite `messages` with stale server data after `sendAndReceiveAI` already pushed the user + AI messages.

---

## Key Design Decisions

- **No WebSockets** — pure REST request/response
- **AI is rule-based** — intent detection + RAG + canned responses (no external LLM)
- **RAG** — hybrid scoring: 0.6 vector (sine-based keyword embedding) + 0.4 keyword (MongoDB `$in`)
- **Memory** — short-term (in-memory Map, 30min TTL) + long-term (MongoDB ChatMemory, 90day TTL)
- **No file attachments actually sent** — UI shows attachment button but `handleSubmit` receives `file` param; backend does not process files

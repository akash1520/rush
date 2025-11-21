'use client';

import { useChat, type Message } from 'ai/react';
import { useChatMessages, useCreateChatMessage } from '../../../../lib/api';

interface ChatPanelProps {
  projectId: string;
  onGenerated?: () => void;
}

export function ChatPanel({ projectId, onGenerated }: ChatPanelProps) {
  const { data: savedMessages } = useChatMessages(projectId);
  const createChatMessage = useCreateChatMessage();

  // Convert saved messages to useChat format
  const initialMessages: Message[] = savedMessages
    ? savedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))
    : [];

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai',
    body: { projectId },
    initialMessages,
    onFinish: async (message) => {
      // Save assistant message to database
      try {
        await createChatMessage.mutateAsync({
          projectId,
          role: 'assistant',
          content: message.content,
        });
      } catch (error) {
        console.error('Failed to save assistant message:', error);
      }
      // Refresh project data after generation
      onGenerated?.();
    },
  });

  // Save user messages to database
  const handleSubmitWithSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage) return;

    // Save user message immediately
    await createChatMessage.mutateAsync({
      projectId,
      role: 'user',
      content: userMessage,
    });

    // Then submit to AI
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark border-l border-border-light dark:border-border-dark">
      {/* Header */}
      <div className="p-4 border-b border-border-light dark:border-border-dark bg-primary-light dark:bg-primary-dark">
        <h3 className="font-semibold text-lg text-white dark:text-black">Rush</h3>
        <p className="text-xs text-white/80 dark:text-black/80">Ask Rush anything about your project</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-light dark:text-muted-dark">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-sm">Start a conversation!</p>
            <p className="text-xs mt-2">
              Try: "Create a landing page for a coffee shop"
            </p>
          </div>
        )}

        {messages.map((message: Message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-primary-light dark:bg-primary-dark text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-fg-light dark:text-fg-dark border border-border-light dark:border-border-dark'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-fg-light dark:text-fg-dark">
                <div className="animate-pulse">Generating...</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmitWithSave} className="p-4 border-t border-border-light dark:border-border-dark">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Describe what you want to build..."
            className="flex-1 px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark focus:border-primary-light dark:focus:border-primary-dark focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 border border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark text-white dark:text-black rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}


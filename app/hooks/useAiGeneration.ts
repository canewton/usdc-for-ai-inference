import type { Message } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

interface AiGenerationHook {
  api: string;
  body: any;
  onFinish: (message: any, { usage }: any) => Promise<void>;
}

export function useAiGeneration<T>({ api, body, onFinish }: AiGenerationHook) {
  const {
    messages: textStreamMessages,
    input: chatInput,
    handleInputChange,
    isLoading: isAiInferenceLoading,
    setMessages,
    handleSubmit,
    stop,
    setInput,
  } = useChat({ api, body, onFinish });

  const [aiMessages, setAiMessagesState] = useState<T[]>([]);

  function isMessage(item: unknown): item is Message {
    return (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      typeof item.id === 'string' &&
      'role' in item &&
      'content' in item &&
      typeof item.content === 'string' &&
      'promptTokens' in item &&
      'completionTokens' in item &&
      'provider' in item
    );
  }

  function isMessageArray<T>(messages: T[]) {
    if (messages.length === 0) {
      return true;
    }
    return messages.every(isMessage);
  }

  const setAiMessages = (messagesInput: T[] | ((prevMsgs: T[]) => T[])) => {
    if (typeof messagesInput === 'function') {
      const temp = messagesInput(aiMessages);
      setAiMessagesState(temp);

      if (isMessageArray(temp)) {
        setMessages(temp as Message[]);
      }
      return;
    }
    setAiMessagesState(messagesInput);

    if (isMessageArray(messagesInput)) {
      setMessages(messagesInput as Message[]);
    }
  };

  return {
    textStreamMessages,
    aiMessages,
    chatInput,
    isAiInferenceLoading,
    handleInputChange,
    setAiMessages,
    handleSubmit,
    stop,
    setInput,
  };
}

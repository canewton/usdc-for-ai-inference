import type { ChatGeneration } from '@/types/database.types';

export class ChatGenerationController {
  private static instance: ChatGenerationController;
  static getInstance(): ChatGenerationController {
    if (!ChatGenerationController.instance) {
      ChatGenerationController.instance = new ChatGenerationController();
    }
    return ChatGenerationController.instance;
  }

  async create(body: string): Promise<ChatGeneration | null> {
    try {
      const response = await fetch('/api/chat-generation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.text());
      else {
        return data;
      }
    } catch (error) {
      console.error('Error saving chat:', error);
      return null;
    }
  }

  async fetch(): Promise<ChatGeneration[] | null> {
    try {
      const response = await fetch(`/api/chat-generation`, {
        method: 'GET',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.text());
      return data;
    } catch (error) {
      console.error('Fetch chat messages error:', error);
      return null;
    }
  }

  async fetchById(id: string): Promise<ChatGeneration[] | null> {
    if (!id.trim()) return null;
    try {
      const response = await fetch(`/api/chat-generation/${id}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.text());
      return data;
    } catch (error) {
      console.error('Fetch chat messages error:', error);
      return null;
    }
  }

  async delete(id: string): Promise<ChatGeneration | null> {
    try {
      const response = await fetch(`/api/chat-generation/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.text());
      return result;
    } catch (error) {
      console.error('Delete request failed:', error);
      return null;
    }
  }
}

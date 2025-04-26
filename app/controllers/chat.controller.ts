import type { Chat } from '@/types/database.types';

export class ChatController {
  private constructor() {}

  private static instance: ChatController;
  static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  async delete(id: string): Promise<Chat | null> {
    try {
      const response = await fetch(`/api/deletechat?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(await response.text());
      return result;
    } catch (error) {
      console.error('Delete request failed:', error);
      return null;
    }
  }

  async fetch(): Promise<Chat[] | null> {
    try {
      const response = await fetch(`/api/getchats`, {
        method: 'GET',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(await response.text());
      return data;
    } catch (error) {
      console.error('Error fetching chats:', error);
      return null;
    }
  }

  async create(title: string): Promise<Chat | null> {
    try {
      const response = await fetch('/api/postchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(await response.text());
      return data;
    } catch (error) {
      console.error('Error saving chat:', error);
      return null;
    }
  }
}

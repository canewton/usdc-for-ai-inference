import type { ImageGeneration } from '@/types/database.types';

export class ImageGenerationController {
  private static instance: ImageGenerationController;
  static getInstance(): ImageGenerationController {
    if (!ImageGenerationController.instance) {
      ImageGenerationController.instance = new ImageGenerationController();
    }
    return ImageGenerationController.instance;
  }

  async create(body: string): Promise<ImageGeneration | null> {
    try {
      const response = await fetch('/api/postimagegeneration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      if (!response.ok) throw new Error(await response.text());
      else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error saving chat:', error);
      return null;
    }
  }

  async fetch(id: string): Promise<ImageGeneration[] | null> {
    if (!id.trim()) return null;
    try {
      const response = await fetch(`/api/getgeneratedimages?imageids=${id}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(await response.text());
      return data;
    } catch (error) {
      console.error('Fetch chat messages error:', error);
      return null;
    }
  }

  async delete(id: string): Promise<ImageGeneration | null> {
    try {
      const response = await fetch(`/api/deleteimage?imageid=${id}`, {
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
}

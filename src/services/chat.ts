// Chat Service
import { ChatRequest, ChatResponse, ChatSession } from '@/types';
import { authService } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

class ChatService {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }

    return response.json();
  }

  async getSessions(): Promise<ChatSession[]> {
    const response = await fetch(`${API_BASE}/api/chat/sessions`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get chat sessions');
    }

    return response.json();
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    const response = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get chat session');
    }

    return response.json();
  }

  async createSession(title?: string): Promise<ChatSession> {
    const response = await fetch(`${API_BASE}/api/chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`,
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat session');
    }

    return response.json();
  }

  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete chat session');
    }
  }
}

export const chatService = new ChatService();
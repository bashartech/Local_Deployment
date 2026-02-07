import { authClient } from '@/lib/auth-client';

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatRequest {
  conversation_id?: number;
  message: string;
}

interface ChatResponse {
  conversation_id: number;
  response: string;
  tool_calls: Array<{
    id: string;
    function: {
      name: string;
      arguments: string;
    };
    type: string;
  }>;
}

class ChatService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  }

  /**
   * Send a chat message to the backend API
   */
  async sendMessage(message: string, conversationId?: number | null): Promise<ChatResponse> {
    try {
      // Get the current user's session
      const session = await authClient.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Extract user ID from session with broader type safety
      const sessionData = session as any;
      console.log("Debug: Session object structure:", JSON.stringify(sessionData, null, 2)); // Debug log

      // Better Auth session structure: { data: { session: {...}, user: {...} }, error: null }
      // So we need to access session.data.session.userId or session.data.user.id
      const userId = sessionData?.data?.session?.userId ||
                     sessionData?.data?.user?.id ||
                     sessionData?.session?.userId ||
                     sessionData?.user?.id;

      // Get the proper JWT token using the JWT client plugin
      // The session.token is a session token, not a JWT - we need the JWT for Authorization header
      let token = null;
      try {
        const tokenResult = await authClient.token();
        if (tokenResult && 'data' in tokenResult && tokenResult.data?.token) {
          token = tokenResult.data.token;
        }
      } catch (jwtError) {
        console.warn('Could not retrieve JWT token:', jwtError);
        // Fallback to session token if JWT is not available, but this may not work with our backend
        token = sessionData?.data?.session?.token || sessionData?.session?.token;
      }

      console.log("Debug: Extracted userId:", userId); // Debug log
      console.log("Debug: Retrieved JWT token (first 10 chars):", token ? token.substring(0, 10) + "..." : "null"); // Debug log

      if (!userId) {
        console.error('Session data structure:', JSON.stringify(sessionData, null, 2));
        throw new Error('User ID not found in session. Session object does not contain expected user ID. Structure might have changed.');
      }

      if (!token) {
        console.error('Session data structure:', JSON.stringify(sessionData, null, 2));
        console.warn('Token not found in session, attempting to proceed with user ID only for X-User-ID header');
        // For MCP server, we might be able to proceed with just the user ID in the header
        // The backend JWT middleware supports both JWT tokens and X-User-ID header
      }

      // Prepare the request body
      const requestBody: ChatRequest = {
        message: message,
        conversation_id: conversationId || undefined
      };

      // Make the API call to the backend
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authentication - either token or user ID depending on what's available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // If no token, rely on the X-User-ID header which the backend JWT middleware supports
        headers['X-User-ID'] = userId;
        console.log("Using X-User-ID header for authentication instead of JWT token");
      }

      // Ensure proper URL construction - if baseUrl already ends with /api, don't add it again
      const normalizedBaseUrl = this.baseUrl.endsWith('/api') ? this.baseUrl.slice(0, -4) : this.baseUrl;
      const response = await fetch(`${normalizedBaseUrl}/api/${userId}/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history (if needed for initialization)
   */
  async getConversationHistory(conversationId: number): Promise<ChatMessage[]> {
    // This would be implemented based on your backend API
    // For now returning empty array as the chat endpoint handles history internally
    return [];
  }
}

export const chatService = new ChatService();
export type { ChatMessage, ChatRequest, ChatResponse };
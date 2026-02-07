import { z } from "zod";
import axios from "axios";

// Define the structure for MCP tools
interface MCPTaskTool {
  name: string;
  definition: {
    title: string;
    description: string;
    inputSchema: z.ZodSchema | Record<string, any>;
    outputSchema?: z.ZodSchema | Record<string, any>;
  };
  handler: (params: any) => Promise<any>;
}

/**
 * Creates an HTTP client to communicate with the backend API
 * Uses the environment variables for configuration
 */
function createBackendClient() {
  const baseURL = process.env.BACKEND_URL || "http://localhost:8000";
  const apiKey = process.env.BACKEND_API_KEY; // Optional API key if required

  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      ...(apiKey && { "Authorization": `Bearer ${apiKey}` }),
    },
    timeout: 10000, // 10 second timeout
  });
}

/**
 * MCP Tool: add_task
 * Spec: {user_id (string, required), title (string, required), description (string, optional)}
 *       → {"task_id": 5, "status": "created", "title": "Buy groceries"}
 */
export async function createAddTaskTool(): Promise<MCPTaskTool> {
  return {
    name: "add_task",
    definition: {
      title: "Add Task",
      description: "Add a new task to the user's task list",
      inputSchema: z.object({
        user_id: z.string(),
        title: z.string(),
        description: z.string().optional()
      }),
      outputSchema: z.object({
        task_id: z.number().int(),
        status: z.string(),
        title: z.string()
      })
    },
    handler: async (params: { user_id: string; title: string; description?: string }) => {
      try {
        const client = createBackendClient();

        // Prepare the task data according to the backend API contract
        const taskData = {
          title: params.title,
          description: params.description || null,
          completed: false, // New tasks are not completed by default
          priority: "medium", // Default priority
          tags: [], // Default empty tags array
          due_date: null, // No due date by default
          is_recurring: false, // Not recurring by default
          recurrence_type: null, // No recurrence type
          recurrence_interval: 1, // Default interval
          next_run_at: null, // No next run time
          reminder_at: null // No reminder by default
        };

        // Make the API call to create the task
        // Note: In a real implementation, we would need to pass the actual JWT token
        // For now, we'll pass the user_id as a header that the backend can validate
        const response = await client.post(`/api/tasks`, taskData, {
          headers: {
            "X-User-ID": params.user_id, // Pass user_id in a custom header for backend validation
            "Content-Type": "application/json"
          }
        });

        // Return response in the exact format specified by the spec
        return {
          task_id: response.data.id,
          status: "created",
          title: response.data.title
        };
      } catch (error: any) {
        console.error("Error in add_task MCP tool:", error);

        // Return an error response that follows the spec format
        throw new Error(`Failed to add task: ${error.response?.data?.detail || error.message}`);
      }
    }
  };
}

/**
 * MCP Tool: list_tasks
 * Spec: {user_id (string, required), status (string, optional: "all", "pending", "completed")}
 *       → Array of task objects
 */
export async function createListTasksTool(): Promise<MCPTaskTool> {
  return {
    name: "list_tasks",
    definition: {
      title: "List Tasks",
      description: "List all tasks for a user with optional filtering by completion status",
      inputSchema: z.object({
        user_id: z.string(),
        status: z.enum(["all", "pending", "completed"]).optional().default("all")
      }),
      outputSchema: z.object({
        tasks: z.array(z.object({
          id: z.number(),
          title: z.string(),
          description: z.string().optional(),
          completed: z.boolean(),
          priority: z.string().optional(),
          created_at: z.string(),
          updated_at: z.string()
        }))
      })
    },
    handler: async (params: { user_id: string; status?: string }) => {
      try {
        const client = createBackendClient();

        // Build query parameters
        const queryParams: Record<string, string> = {};
        if (params.status && params.status !== "all") {
          queryParams.completed = params.status;
        }

        // Make the API call to list tasks
        const response = await client.get(`/api/tasks`, {
          params: queryParams,
          headers: {
            "X-User-ID": params.user_id, // Pass user_id in a custom header for backend validation
          }
        });

        // Return response in the format specified by the spec
        return {
          tasks: response.data.map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            completed: task.completed,
            priority: task.priority,
            tags: Array.isArray(task.tags) ? task.tags : [],
            due_date: task.due_date,
            created_at: task.created_at,
            updated_at: task.updated_at
          }))
        };
      } catch (error: any) {
        console.error("Error in list_tasks MCP tool:", error);

        // Return an error response that follows the spec format
        throw new Error(`Failed to list tasks: ${error.response?.data?.detail || error.message}`);
      }
    }
  };
}

/**
 * MCP Tool: complete_task
 * Spec: {user_id (string, required), task_id (integer, required)}
 *       → {"task_id": 3, "status": "completed", "title": "Call mom"}
 */
export async function createCompleteTaskTool(): Promise<MCPTaskTool> {
  return {
    name: "complete_task",
    definition: {
      title: "Complete Task",
      description: "Mark a task as completed",
      inputSchema: z.object({
        user_id: z.string(),
        task_id: z.number().int()
      }),
      outputSchema: z.object({
        task_id: z.number().int(),
        status: z.string(),
        title: z.string()
      })
    },
    handler: async (params: { user_id: string; task_id: number }) => {
      try {
        const client = createBackendClient();

        // Make the API call to complete the task
        const response = await client.patch(`/api/tasks/${params.task_id}/complete`, {}, {
          headers: {
            "X-User-ID": params.user_id, // Pass user_id in a custom header for backend validation
          }
        });

        // Return response in the exact format specified by the spec
        return {
          task_id: response.data.id,
          status: "completed",
          title: response.data.title
        };
      } catch (error: any) {
        console.error("Error in complete_task MCP tool:", error);

        // Return an error response that follows the spec format
        throw new Error(`Failed to complete task: ${error.response?.data?.detail || error.message}`);
      }
    }
  };
}

/**
 * MCP Tool: delete_task
 * Spec: {user_id (string, required), task_id (integer, required)}
 *       → {"task_id": 2, "status": "deleted", "title": "Old task"}
 */
export async function createDeleteTaskTool(): Promise<MCPTaskTool> {
  return {
    name: "delete_task",
    definition: {
      title: "Delete Task",
      description: "Delete a task from the user's task list",
      inputSchema: z.object({
        user_id: z.string(),
        task_id: z.number().int()
      }),
      outputSchema: z.object({
        task_id: z.number().int(),
        status: z.string(),
        title: z.string()
      })
    },
    handler: async (params: { user_id: string; task_id: number }) => {
      try {
        const client = createBackendClient();

        // Make the API call to delete the task
        const response = await client.delete(`/api/tasks/${params.task_id}`, {
          headers: {
            "X-User-ID": params.user_id, // Pass user_id in a custom header for backend validation
          }
        });

        // Return response in the exact format specified by the spec
        return {
          task_id: params.task_id,
          status: "deleted",
          title: response.data.title || "Deleted task" // Backend may not return title in delete response
        };
      } catch (error: any) {
        console.error("Error in delete_task MCP tool:", error);

        // Return an error response that follows the spec format
        throw new Error(`Failed to delete task: ${error.response?.data?.detail || error.message}`);
      }
    }
  };
}

/**
 * MCP Tool: update_task
 * Spec: {user_id (string, required), task_id (integer, required), title (string, optional), description (string, optional)}
 *       → {"task_id": 1, "status": "updated", "title": "Buy groceries and fruits"}
 */
export async function createUpdateTaskTool(): Promise<MCPTaskTool> {
  return {
    name: "update_task",
    definition: {
      title: "Update Task",
      description: "Update an existing task in the user's task list",
      inputSchema: z.object({
        user_id: z.string(),
        task_id: z.number().int(),
        title: z.string().optional(),
        description: z.string().optional()
      }),
      outputSchema: z.object({
        task_id: z.number().int(),
        status: z.string(),
        title: z.string()
      })
    },
    handler: async (params: { user_id: string; task_id: number; title?: string; description?: string }) => {
      try {
        const client = createBackendClient();

        // Prepare the update data according to the backend API contract
        const updateData: any = {};
        if (params.title !== undefined) updateData.title = params.title;
        if (params.description !== undefined) updateData.description = params.description;

        // Make the API call to update the task
        const response = await client.put(`/api/tasks/${params.task_id}`, updateData, {
          headers: {
            "X-User-ID": params.user_id, // Pass user_id in a custom header for backend validation
          }
        });

        // Return response in the exact format specified by the spec
        return {
          task_id: response.data.id,
          status: "updated",
          title: response.data.title
        };
      } catch (error: any) {
        console.error("Error in update_task MCP tool:", error);

        // Return an error response that follows the spec format
        throw new Error(`Failed to update task: ${error.response?.data?.detail || error.message}`);
      }
    }
  };
}
// Frontend task service for authenticated data flow
import { api, Task } from '@/lib/api';

export const taskService = {
  // Get all tasks
  getTasks: async (completed?: 'all' | 'pending' | 'completed'): Promise<Task[]> => {
    return await api.tasks.getTasks(completed);
  },

  // Create a new task
  createTask: async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    return await api.tasks.createTask(taskData);
  },

  // Update a task
  updateTask: async (taskId: number, taskData: Partial<Task>): Promise<Task> => {
    return await api.tasks.updateTask(taskId, taskData);
  },

  // Toggle task completion
  toggleTaskCompletion: async (taskId: number): Promise<Task> => {
    return await api.tasks.toggleTaskCompletion(taskId);
  },

  // Delete a task
  deleteTask: async (taskId: number): Promise<void> => {
    await api.tasks.deleteTask(taskId);
  },
};

// Export individual functions for direct use
export const {
  getTasks,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
} = taskService;
import {
  createAddTaskTool,
  createListTasksTool,
  createCompleteTaskTool,
  createDeleteTaskTool,
  createUpdateTaskTool
} from '../src/tools/task-tools';

/**
 * Test MCP tools independently with spec examples
 * This file tests each MCP tool according to the exact specifications
 */

async function testAddTaskTool() {
  console.log('Testing add_task tool...');

  try {
    const addTaskTool = await createAddTaskTool();

    // Test with spec example: {user_id: "user123", title: "Buy groceries", description: "Milk, bread, eggs"}
    const result = await addTaskTool.handler({
      user_id: "user123",
      title: "Buy groceries",
      description: "Milk, bread, eggs"
    });

    console.log('Add task result:', result);

    // Validate response format matches spec: {"task_id": 5, "status": "created", "title": "Buy groceries"}
    if (typeof result.task_id === 'number' &&
        result.status === 'created' &&
        typeof result.title === 'string') {
      console.log('✅ Add task tool response format is correct');
    } else {
      console.log('❌ Add task tool response format is incorrect');
    }
  } catch (error) {
    console.error('❌ Error testing add_task tool:', error);
  }
}

async function testListTasksTool() {
  console.log('\nTesting list_tasks tool...');

  try {
    const listTasksTool = await createListTasksTool();

    // Test with spec example: {user_id: "user123", status: "all"}
    const result = await listTasksTool.handler({
      user_id: "user123",
      status: "all"
    });

    console.log('List tasks result:', result);

    // Validate response format matches spec: Array of task objects
    if (result.tasks && Array.isArray(result.tasks)) {
      console.log('✅ List tasks tool response format is correct');
    } else {
      console.log('❌ List tasks tool response format is incorrect');
    }
  } catch (error) {
    console.error('❌ Error testing list_tasks tool:', error);
  }
}

async function testCompleteTaskTool() {
  console.log('\nTesting complete_task tool...');

  try {
    const completeTaskTool = await createCompleteTaskTool();

    // Test with spec example: {user_id: "user123", task_id: 3}
    const result = await completeTaskTool.handler({
      user_id: "user123",
      task_id: 3
    });

    console.log('Complete task result:', result);

    // Validate response format matches spec: {"task_id": 3, "status": "completed", "title": "Call mom"}
    if (typeof result.task_id === 'number' &&
        result.status === 'completed' &&
        typeof result.title === 'string') {
      console.log('✅ Complete task tool response format is correct');
    } else {
      console.log('❌ Complete task tool response format is incorrect');
    }
  } catch (error) {
    console.error('❌ Error testing complete_task tool:', error);
  }
}

async function testDeleteTaskTool() {
  console.log('\nTesting delete_task tool...');

  try {
    const deleteTaskTool = await createDeleteTaskTool();

    // Test with spec example: {user_id: "user123", task_id: 2}
    const result = await deleteTaskTool.handler({
      user_id: "user123",
      task_id: 2
    });

    console.log('Delete task result:', result);

    // Validate response format matches spec: {"task_id": 2, "status": "deleted", "title": "Old task"}
    if (typeof result.task_id === 'number' &&
        result.status === 'deleted' &&
        typeof result.title === 'string') {
      console.log('✅ Delete task tool response format is correct');
    } else {
      console.log('❌ Delete task tool response format is incorrect');
    }
  } catch (error) {
    console.error('❌ Error testing delete_task tool:', error);
  }
}

async function testUpdateTaskTool() {
  console.log('\nTesting update_task tool...');

  try {
    const updateTaskTool = await createUpdateTaskTool();

    // Test with spec example: {user_id: "user123", task_id: 1, title: "Buy groceries and fruits"}
    const result = await updateTaskTool.handler({
      user_id: "user123",
      task_id: 1,
      title: "Buy groceries and fruits"
    });

    console.log('Update task result:', result);

    // Validate response format matches spec: {"task_id": 1, "status": "updated", "title": "Buy groceries and fruits"}
    if (typeof result.task_id === 'number' &&
        result.status === 'updated' &&
        typeof result.title === 'string') {
      console.log('✅ Update task tool response format is correct');
    } else {
      console.log('❌ Update task tool response format is incorrect');
    }
  } catch (error) {
    console.error('❌ Error testing update_task tool:', error);
  }
}

async function runAllTests() {
  console.log('Starting MCP tools tests with spec examples...\n');

  await testAddTaskTool();
  await testListTasksTool();
  await testCompleteTaskTool();
  await testDeleteTaskTool();
  await testUpdateTaskTool();

  console.log('\nCompleted testing MCP tools with spec examples');
}

// Run the tests
runAllTests().catch(console.error);
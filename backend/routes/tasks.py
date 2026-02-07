from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List
try:
    from ..models.task import Task, TaskCreate, TaskRead, TaskUpdate
    from ..db import get_session
    from ..auth import get_user_id_from_token
    from ..crud.task import (
        create_task as crud_create_task,
        get_tasks_by_user,
        get_task_by_id_and_user,
        get_task_by_id,
        update_task as crud_update_task,
        toggle_task_completion,
        delete_task as crud_delete_task
    )
except ImportError:
    from models.task import Task, TaskCreate, TaskRead, TaskUpdate
    from db import get_session
    from auth import get_user_id_from_token
    from crud.task import (
        create_task as crud_create_task,
        get_tasks_by_user,
        get_task_by_id_and_user,
        get_task_by_id,
        update_task as crud_update_task,
        toggle_task_completion,
        delete_task as crud_delete_task
    )
import os

router = APIRouter(tags=["tasks"])

@router.post("/tasks", response_model=TaskRead)
def create_task(
    task: TaskCreate,
    user_id: str = Depends(get_user_id_from_token),
    session: Session = Depends(get_session)
):
    """
    Create a new task for the authenticated user.

    The user_id is extracted from the JWT token, not from the request body,
    ensuring users can only create tasks for themselves.
    """
    db_task = crud_create_task(session, task, user_id)
    return db_task


@router.get("/tasks", response_model=List[TaskRead])
def read_tasks(
    user_id: str = Depends(get_user_id_from_token),
    session: Session = Depends(get_session),
    completed: str = None,  # "all", "pending", "completed"
    priority: str = None,   # "low", "medium", "high"
    search: str = None,     # search term for title/description
    sort: str = "created_at",  # field to sort by
    order: str = "desc",      # sort order: "asc" or "desc"
    tags: str = None        # tag to filter by
):
    """
    Retrieve all tasks for the authenticated user with optional filtering, search, and sorting.

    Query parameters:
    - completed: Filter by completion status ("pending", "completed", "all")
    - priority: Filter by priority level ("low", "medium", "high")
    - search: Search term to match in title or description
    - sort: Field to sort by ("created_at", "due_date", "priority", "title")
    - order: Sort order ("asc", "desc")
    - tags: Filter by a specific tag
    """
    tasks = get_tasks_by_user(
        session,
        user_id,
        completed=completed,
        priority=priority,
        search=search,
        sort=sort,
        order=order,
        tags=tags
    )
    return tasks


@router.get("/tasks/{task_id}", response_model=TaskRead)
def read_task(
    task_id: int,
    user_id: str = Depends(get_user_id_from_token),
    session: Session = Depends(get_session)
):
    """
    Retrieve a specific task by ID.

    Users can only access their own tasks. If a task doesn't exist
    a 404 error is returned. If the task exists but belongs to another user,
    a 403 error is returned.
    """
    # First check if the task exists (without checking ownership)
    task_exists = get_task_by_id(session, task_id)

    if not task_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Now check if the task belongs to the authenticated user
    task = get_task_by_id_and_user(session, task_id, user_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to access this task"
        )

    return task


@router.put("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    user_id: str = Depends(get_user_id_from_token),
    session: Session = Depends(get_session)
):
    """
    Update a specific task by ID.

    Users can only update their own tasks. The update can include
    title, description, and completion status.
    """
    # First check if the task exists (without checking ownership)
    task_exists = get_task_by_id(session, task_id)

    if not task_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Now try to update the task (ownership check happens in the CRUD function)
    updated_task = crud_update_task(session, task_id, user_id, task_update)

    if not updated_task:
        # If the task exists but wasn't updated, it means the user doesn't own it
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to update this task"
        )

    return updated_task


@router.patch("/tasks/{task_id}/complete", response_model=TaskRead)
def update_task_completion(
    task_id: int,
    user_id: str = Depends(get_user_id_from_token),
    session: Session = Depends(get_session)
):
    """
    Toggle the completion status of a task.

    Users can only update their own tasks.
    """
    # First check if the task exists (without checking ownership)
    task_exists = get_task_by_id(session, task_id)

    if not task_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Now try to toggle the task completion (ownership check happens in the CRUD function)
    updated_task = toggle_task_completion(session, task_id, user_id)

    if not updated_task:
        # If the task exists but wasn't updated, it means the user doesn't own it
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to update this task"
        )

    return updated_task


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    user_id: str = Depends(get_user_id_from_token),
    session: Session = Depends(get_session)
):
    """
    Delete a specific task by ID.

    Users can only delete their own tasks.
    """
    # First check if the task exists (without checking ownership)
    task_exists = get_task_by_id(session, task_id)

    if not task_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Now try to delete the task (ownership check happens in the CRUD function)
    success = crud_delete_task(session, task_id, user_id)

    if not success:
        # If the task exists but wasn't deleted, it means the user doesn't own it
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to delete this task"
        )

    return {"message": "Task deleted successfully"}
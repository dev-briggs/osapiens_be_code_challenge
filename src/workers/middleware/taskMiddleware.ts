import { Task } from "../../models/Task";
import { getDependencyTask, getTasksInSameWorkflow } from "../../utils/tasks";
import { TaskStatus } from "../taskRunner";

/**
 * Middleware to validate if a task is ready to run.
 * Currently checks if all preceding tasks are completed or failed.
 * @param workflowTasks - All tasks in the workflow.
 * @param currentTask - The current task being processed.
 * @returns True if the task is ready to run, false otherwise.
 */
export async function checkAllPrecedingTasksInWorkflowCompletedOrFailed(
  task: Task
): Promise<boolean> {
  const workflowTasks = await getTasksInSameWorkflow(task);

  // Use stepNumber to determine preceding tasks
  const precedingTasks = workflowTasks.filter(
    (t) => t.stepNumber < task.stepNumber
  );

  // Check if all preceding tasks are completed or failed
  const allPrecedingTasksCompletedOrFailed = precedingTasks.every(
    (t) => t.status === TaskStatus.Completed || t.status === TaskStatus.Failed
  );

  return allPrecedingTasksCompletedOrFailed;
}

export async function checkDependencyTaskInWorkflowCompleted(
  task: Task
): Promise<boolean> {
  if (!task.dependsOn) return true;

  const dependencyTask = await getDependencyTask(task);

  return dependencyTask
    ? dependencyTask.status === TaskStatus.Completed
    : false;
}

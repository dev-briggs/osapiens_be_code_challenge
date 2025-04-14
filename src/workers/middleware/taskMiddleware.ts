import { AppDataSource } from "../../data-source";
import { Task } from "../../models/Task";
import { TaskStatus } from "../taskRunner";

/**
 * Middleware to validate if a task is ready to run.
 * Currently checks if all preceding tasks are completed or failed.
 * @param workflowTasks - All tasks in the workflow.
 * @param currentTask - The current task being processed.
 * @returns True if the task is ready to run, false otherwise.
 */
export async function allPrecedingTasksCompletedOrFailed(
  task: Task
): Promise<boolean> {
  const taskRepository = AppDataSource.getRepository(Task);

  const workflowTasks = await taskRepository.find({
    where: { workflow: { workflowId: task.workflow.workflowId } },
  });

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

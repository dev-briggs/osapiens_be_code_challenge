import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";

export async function getTasksInSameWorkflow(task: Task): Promise<Task[]> {
  const taskRepository = AppDataSource.getRepository(Task);
  const workflowTasks = await taskRepository.find({
    where: { workflow: { workflowId: task.workflow.workflowId } },
  });
  return workflowTasks;
}

export async function getDependencyTask(task: Task): Promise<Task | null> {
  if (!task.dependsOn) return null; // No dependency task

  const taskRepository = AppDataSource.getRepository(Task);
  const dependencyTask = await taskRepository.findOne({
    where: { taskId: task.dependsOn.taskId },
  });
  return dependencyTask;
}

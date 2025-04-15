import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import {
  checkAllPrecedingTasksInWorkflowCompletedOrFailed,
  checkDependencyTaskInWorkflowCompleted,
} from "./middleware/taskMiddleware";
import { TaskRunner, TaskStatus } from "./taskRunner";

export async function taskWorker() {
  const taskRepository = AppDataSource.getRepository(Task);
  const taskRunner = new TaskRunner(taskRepository);

  while (true) {
    const queuedTasks = await taskRepository.find({
      where: { status: TaskStatus.Queued },
      relations: ["workflow", "dependsOn"], // Ensure workflow and dependsOn is loaded
      order: { stepNumber: "ASC" },
    });

    if (queuedTasks.length > 0) {
      for (const task of queuedTasks) {
        try {
          // Only check preceding tasks if the taskType is "reportGeneration"
          if (task.taskType === "reportGeneration") {
            const proceed =
              await checkAllPrecedingTasksInWorkflowCompletedOrFailed(task);

            if (!proceed) {
              console.log(
                `Task ${task.taskId} is waiting for preceding tasks to complete or fail. Re-queuing the task.`
              );
              continue;
            }
          }

          console.log(
            `task: ${task.taskId} depends on ${
              task.dependsOn?.taskId || "no dependency"
            }`
          );
          if (task.dependsOn) {
            const proceed = await checkDependencyTaskInWorkflowCompleted(task);

            if (!proceed) {
              console.log(
                `Task ${task.taskId} is waiting for dependent task to complete or fail. Re-queuing the task.`
              );
              continue;
            }
          }

          console.log(`Running task ${task.taskId} (${task.taskType})...`);
          await taskRunner.run(task);
        } catch (error) {
          console.error(
            "Task execution failed. Task status has already been updated by TaskRunner."
          );
          console.error(error);
        }

        await new Promise((resolve) => setTimeout(resolve, 5000)); // poll for 5 seconds
      }
    }

    // Wait before checking for the next task again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

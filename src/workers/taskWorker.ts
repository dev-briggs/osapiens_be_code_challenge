import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { allPrecedingTasksCompletedOrFailed } from "./middleware/taskMiddleware";
import { TaskRunner, TaskStatus } from "./taskRunner";

export async function taskWorker() {
  const taskRepository = AppDataSource.getRepository(Task);
  const taskRunner = new TaskRunner(taskRepository);

  while (true) {
    const queuedTasks = await taskRepository.find({
      where: { status: TaskStatus.Queued },
      relations: ["workflow"], // Ensure workflow is loaded
      order: { stepNumber: "ASC" },
    });

    if (queuedTasks.length > 0) {
      for (const task of queuedTasks) {
        try {
          // Only check preceding tasks if the taskType is "reportGeneration"
          if (task.taskType === "reportGeneration") {
            const proceed = await allPrecedingTasksCompletedOrFailed(task);

            if (!proceed) {
              console.log(
                `Task ${task.taskId} is waiting for preceding tasks to complete or fail. Re-queuing the task.`
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
      }
    }

    // Wait before checking for the next task again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

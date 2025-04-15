import { Job } from "./Job";
import { Task } from "../models/Task";
import { Stringified } from "../types";
import { ReportOutput, ReportTask } from "../types/reports";
import { TaskStatus } from "../workers/taskRunner";
import { getTasksInSameWorkflow } from "../utils/tasks";

/**
 * Class representing a job for generating reports based on task workflows.
 */
export class ReportGenerationJob implements Job {
  /**
   * Executes the report generation process for a given task.
   *
   * @param {Task} task - The task for which the report is being generated.
   * @returns {Promise<void>} A promise that resolves when the report generation is complete.
   *
   * @throws Will catch and handle any errors during the report generation process.
   *         Sets the task status to `TaskStatus.Failed` and logs the error.
   *
   * The method performs the following steps:
   * 1. Retrieves all tasks associated with the same workflow as the given task.
   * 2. Filters tasks that precede the current task in the workflow.
   * 3. Maps preceding tasks into a report-friendly format.
   * 4. Checks if any preceding tasks have failed.
   * 5. Generates a final report based on the status of preceding tasks.
   * 6. Saves the report as the output of the current task and marks it as completed.
   */
  async run(task: Task): Promise<void> {
    try {
      const tasks = await getTasksInSameWorkflow(task);
      const precedingTasks = tasks.filter(
        (t) => t.stepNumber < task.stepNumber
      );

      const reportTasks: ReportTask[] = precedingTasks.map((t) => ({
        taskId: t.taskId,
        type: t.taskType,
        output: t.output,
        status: t.status,
      }));

      // Check if any preceding tasks failed
      const hasFailures = reportTasks.some(
        (t) => t.status === TaskStatus.Failed
      );

      // Generate the final report
      const finalReport = hasFailures
        ? "Some tasks failed. Review the task outputs for details."
        : "All tasks completed successfully. Aggregated data is available.";

      // Save the report as the task's output
      const report: ReportOutput = {
        workflowId: task.workflow.workflowId,
        tasks: reportTasks,
        finalReport,
      };

      task.output = JSON.stringify(
        report
      ) as unknown as Stringified<ReportOutput>;
      task.status = TaskStatus.Completed;
    } catch (error) {
      console.error("Error generating report:", error);
      task.status = TaskStatus.Failed;
      task.output = JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }) as unknown as Stringified<{ error: string }>;
    }
  }
}

import { Router } from "express";
import { getWorkerById } from "../utils/workflows";
import { TaskStatus } from "../workers/taskRunner";
import { WorkflowStatus } from "../workflows/WorkflowFactory";

const router = Router();

/**
 * @route GET /:id/status
 * @description Fetch the status of a workflow by its ID
 * @param {string} id - The ID of the workflow
 * @returns {Object} 200 - Workflow status, completed tasks, and total tasks
 * @example Response (200):
 * {
 *   "workflowId": "12345",
 *   "status": "in_progress", // "initial", "in_progress", "completed", "failed"
 *   "completedTasks": 3,
 *   "totalTasks": 5
 * }
 * @returns {Object} 404 - Workflow not found
 * @example Response (404):
 * {
 *   "message": "Workflow not found"
 * }
 * @returns {Object} 500 - Failed to fetch workflow status
 * @example Response (500):
 * {
 *   "message": "Failed to fetch workflow status"
 * }
 */
router.get("/:id/status", async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the workflow by ID
    const workflow = await getWorkerById(id);

    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }

    // Calculate completed and total tasks
    const completedTasks = workflow.tasks.filter(
      (task) => task.status === TaskStatus.Completed
    ).length;
    const totalTasks = workflow.tasks.length;

    res.status(200).json({
      workflowId: workflow.workflowId,
      status: workflow.status,
      completedTasks,
      totalTasks,
    });
  } catch (error: any) {
    console.error("Error fetching workflow status:", error);
    res.status(500).json({ message: "Failed to fetch workflow status" });
  }
});

/**
 * @route GET /:id/results
 * @description Fetch the results of a completed workflow by its ID
 * @param {string} id - The ID of the workflow
 * @returns {Object} 200 - Workflow results and final result
 * @example Response (200):
 * {
 *   "workflowId": "12345",
 *   "status": "Completed",
 *   "finalResult": {
 *     "output": "[JSON Stringified output of the tasks in the workflow]",
 *   }
 * }
 * @returns {Object} 400 - Workflow is not completed
 * @example Response (400):
 * {
 *   "message": "Workflow is not completed"
 * }
 * @returns {Object} 404 - Workflow not found
 * @example Response (404):
 * {
 *   "message": "Workflow not found"
 * }
 * @returns {Object} 500 - Failed to fetch workflow results
 * @example Response (500):
 * {
 *   "message": "Failed to fetch workflow results"
 * }
 */
router.get("/:id/results", async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the workflow by ID
    const workflow = await getWorkerById(id);

    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }

    if (workflow.status !== WorkflowStatus.Completed) {
      res.status(400).json({ message: "Workflow is not completed" });
      return;
    }

    res.status(200).json({
      workflowId: workflow.workflowId,
      status: workflow.status,
      finalResult: workflow.finalResult,
    });
  } catch (error: any) {
    console.error("Error fetching workflow results:", error);
    res.status(500).json({ message: "Failed to fetch workflow results" });
  }
});

export default router;

import { Router } from "express";
import { getWorkerById } from "../utils/workflows";
import { TaskStatus } from "../workers/taskRunner";

const router = Router();

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

export default router;

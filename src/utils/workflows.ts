import { AppDataSource } from "../data-source";
import { Workflow } from "../models/Workflow";

export async function getWorkerById(id: string): Promise<Workflow | null> {
  const workflowRepository = AppDataSource.getRepository(Workflow);
  const workflow = await workflowRepository.findOne({
    where: { workflowId: id },
    relations: ["tasks"], // ensure tasks are included
  });
  return workflow;
}

import * as fs from "fs";
import * as yaml from "js-yaml";
import { DataSource } from "typeorm";
import { Workflow } from "../models/Workflow";
import { Task } from "../models/Task";
import { TaskStatus } from "../workers/taskRunner";

export enum WorkflowStatus {
  Initial = "initial",
  InProgress = "in_progress",
  Completed = "completed",
  Failed = "failed",
}

export interface WorkflowStep {
  taskType: string;
  stepNumber: number;
  dependsOn?: string;
}

export interface WorkflowDefinition {
  name: string;
  steps: WorkflowStep[];
}

export class WorkflowFactory {
  constructor(private dataSource: DataSource) {}

  /**
   * Creates a workflow by reading a YAML file and constructing the Workflow and Task entities.
   * @param filePath - Path to the YAML file.
   * @param clientId - Client identifier for the workflow.
   * @param geoJson - The geoJson data string for tasks (customize as needed).
   * @returns A promise that resolves to the created Workflow.
   */
  async createWorkflowFromYAML(
    filePath: string,
    clientId: string,
    geoJson: string
  ): Promise<Workflow> {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const workflowDef = yaml.load(fileContent) as WorkflowDefinition;
    const workflowRepository = this.dataSource.getRepository(Workflow);
    const taskRepository = this.dataSource.getRepository(Task);
    const workflow = new Workflow();

    workflow.clientId = clientId;
    workflow.status = WorkflowStatus.Initial;

    const savedWorkflow = await workflowRepository.save(workflow);

    const mapWorkflowStepsToTasks = (
      steps: Array<WorkflowStep>,
      dependencies?: Task[]
    ) => {
      return steps.map((step) => {
        const task = new Task();
        task.clientId = clientId;
        task.geoJson = geoJson;
        task.status = TaskStatus.Queued;
        task.taskType = step.taskType;
        task.stepNumber = step.stepNumber;
        task.workflow = savedWorkflow;
        if (dependencies && step.dependsOn) {
          const taskDependency = dependencies.find(
            (dependency) => dependency.taskType === step.dependsOn
          );

          if (!taskDependency) {
            const error = `Task dependency ${step.dependsOn} not found for task ${step.taskType}`;
            console.log(error);
            throw new Error(error);
          }
          task.dependsOn = taskDependency;
        }
        return task;
      });
    };

    const dependencies = workflowDef.steps.map(
      ({ dependsOn }) => dependsOn || ""
    );
    const prerequisiteSteps = workflowDef.steps.filter((step, i) =>
      dependencies.includes(step.taskType)
    );
    const prerequisiteTasks: Task[] =
      mapWorkflowStepsToTasks(prerequisiteSteps);
    const prerequisiteTasksWithId = await taskRepository.save(
      prerequisiteTasks
    ); // save prerequisite tasks to generate uuids

    const nonPrerequisiteSteps = workflowDef.steps.filter(
      (step) => !dependencies.includes(step.taskType)
    );
    const nonPrerequisiteTasks: Task[] = mapWorkflowStepsToTasks(
      nonPrerequisiteSteps,
      prerequisiteTasksWithId
    );

    await taskRepository.save(nonPrerequisiteTasks);

    return savedWorkflow;
  }
}

import { Stringified } from ".";
import { TaskStatus } from "../workers/taskRunner";
import { Output } from "./tasks";

export type ReportTask = {
  taskId: string;
  type: string;
  output: Stringified<Output> | null | undefined;
  status: TaskStatus;
};

export type ReportOutput = {
  workflowId: string;
  tasks: Array<ReportTask>;
  finalReport: string;
};

import { PolygonAreaUnits } from "../jobs/PolygonAreaJob";
import { ReportOutput } from "./reports";

export type OutputSuccess = { area: number; unit: PolygonAreaUnits };
export type OutputError = { error: string };
export type Output = OutputSuccess | OutputError | ReportOutput;

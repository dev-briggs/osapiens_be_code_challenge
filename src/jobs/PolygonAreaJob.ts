import { Job } from "./Job";
import { Task } from "../models/Task";
import area from "@turf/area";
import { Geometry } from "geojson";
import { TaskStatus } from "../workers/taskRunner";
import { Stringified } from "../types";
import { Units } from "@turf/turf";
import { validateGeoJson } from "../utils/geoJsonValidator";

const polygonAreaUnits = ["square meters"] as const;

export type PolygonAreaUnits = Units | (typeof polygonAreaUnits)[number];
export type OutputSuccess = { area: number; unit: PolygonAreaUnits };
export type OutputError = { error: string };
export type Output = OutputSuccess | OutputError;

export class PolygonAreaJob implements Job {
  async run(task: Task): Promise<void> {
    try {
      const geoJson: Geometry = JSON.parse(task.geoJson);

      // Validate GeoJSON
      validateGeoJson(geoJson);

      // Calculate area using @turf/area
      const calculatedArea = area(geoJson);

      // Save the result in the task's output field
      task.output = JSON.stringify({
        area: calculatedArea,
        unit: "square meters",
      } as OutputSuccess) as unknown as Stringified<OutputSuccess>;

      task.status = TaskStatus.Completed;
    } catch (error) {
      console.error("Error calculating polygon area:", error);
      task.status = TaskStatus.Failed;
      task.output = JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      } as OutputError) as unknown as Stringified<OutputError>;
    }
  }
}

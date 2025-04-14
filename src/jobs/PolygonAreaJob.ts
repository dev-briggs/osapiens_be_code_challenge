import { Job } from "./Job";
import { Task } from "../models/Task";
import area from "@turf/area";
import { Geometry } from "geojson";
import { TaskStatus } from "../workers/taskRunner";
import { Stringified } from "../types";
import { Units } from "@turf/turf";
import { validateGeoJson } from "../utils/geoJsonValidator";
import type { OutputError, OutputSuccess } from "../types/tasks";

const polygonAreaUnits = ["square meters"] as const;

export type PolygonAreaUnits = Units | (typeof polygonAreaUnits)[number];

/**
 * Class representing a job to calculate the area of a polygon from GeoJSON data.
 * Implements the `Job` interface.
 */
export class PolygonAreaJob implements Job {
  /**
   * Executes the job to calculate the area of a polygon.
   *
   * @param {Task} task - The task containing the GeoJSON data for the polygon.
   * The `geoJson` field of the task should be a stringified GeoJSON object.
   *
   * @returns {Promise<void>} A promise that resolves when the job is completed.
   *
   * The method performs the following steps:
   * 1. Parses the GeoJSON data from the task.
   * 2. Validates the GeoJSON using the `validateGeoJson` utility.
   * 3. Calculates the area of the polygon using the `@turf/area` library.
   * 4. Saves the calculated area and unit ("square meters") in the task's `output` field.
   * 5. Updates the task's status to `Completed` if successful, or `Failed` if an error occurs.
   *
   * If an error occurs during processing, the error message is saved in the task's `output` field.
   */
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

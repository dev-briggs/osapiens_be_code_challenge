import { Geometry } from "geojson";

import type { Position, GeoJsonGeometryTypes } from "geojson";

/**
 * Validates a GeoJSON object based on RFC 7946. (see https://datatracker.ietf.org/doc/html/rfc7946#section-3)
 * @param geoJson - The GeoJSON object to validate.
 * @throws Error if the GeoJSON object is invalid.
 */
export const geoJsonGeometryTypes: Array<GeoJsonGeometryTypes> = [
  "Point",
  "LineString",
  "Polygon",
  "MultiPoint",
  "MultiLineString",
  "MultiPolygon",
];

export function validateGeoJson(geoJson: Geometry): void {
  if (!geoJson) throw new Error("GeoJSON is null or undefined");

  validateType(geoJson.type);

  /**
   * A GeoJSON object with type "GeometryCollection" is a Geometry object.
   * A GeometryCollection has a member with the name "geometries".
   * The value of "geometries" is an array.
   * Each element of this array is a GeoJSON Geometry object. (https://datatracker.ietf.org/doc/html/rfc7946#section-3.1)
   * It is possible for this array to be empty.
   * (see https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.8)
   */
  if (
    geoJson.type === "GeometryCollection" &&
    !(
      "geometries" in geoJson &&
      Array.isArray(geoJson.geometries) &&
      geoJson.geometries.length > 0
    )
  ) {
    throw new Error(
      `GeometryCollection must have a "geometries" property with at least one geometry`
    );
    // (see https://datatracker.ietf.org/doc/html/rfc7946#appendix-A.7)
  }

  /**
   * A GeoJSON Geometry object of any type other than "GeometryCollection" has a member with the name "coordinates".
   * The value of the "coordinates" member is an array.
   * The structure of the elements in this array is determined by the type of geometry.
   * GeoJSON processors MAY interpret Geometry objects with empty "coordinates" arrays as null objects.
   *
   * For type "Point", the "coordinates" member is a single position.
   * For type "MultiPoint", the "coordinates" member is an array of pan array of two ositions.
   * For type "LineString", the "coordinates" member is or more positions.
   * For type "MultiLineString", the "coordinates" member is an array of LineString coordinate arrays.
   * For type "Polygon" (see https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6)
   * For type "MultiPolygon", the "coordinates" member is an array of Polygon coordinate arrays.
   *
   * Geometry Examples (see https://datatracker.ietf.org/doc/html/rfc7946#appendix-A)
   */
  if ("coordinates" in geoJson && Array.isArray(geoJson.coordinates)) {
    switch (geoJson.type) {
      case "Point":
        validatePoint(geoJson.coordinates);
        break;
      case "LineString":
        validateLineString(geoJson.coordinates);
        break;
      case "Polygon":
        validatePolygon(geoJson.coordinates);
        break;
      case "MultiPoint":
        geoJson.coordinates.forEach(validatePoint);
        break;
      case "MultiLineString":
        geoJson.coordinates.forEach(validateLineString);
        break;
      case "MultiPolygon":
        geoJson.coordinates.forEach(validatePolygon);
        break;
      default:
        break;
    }
  }
}

function validateType(type: GeoJsonGeometryTypes): void {
  if (!geoJsonGeometryTypes.includes(type)) {
    throw new Error(`Unsupported GeoJSON type: ${type}`); // (see https://datatracker.ietf.org/doc/html/rfc7946#section-1.4)
  }
}

function validatePoint(coordinates: Position): void {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    coordinates.some((coord) => typeof coord !== "number")
  ) {
    throw new Error(`Point coordinates must be an array of two numbers [x, y]`);
  }
}

function validateLineString(coordinates: Position[]): void {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    coordinates.some((point) => {
      return (
        !Array.isArray(point) ||
        point.length !== 2 ||
        point.some((coord) => typeof coord !== "number")
      );
    })
  ) {
    throw new Error(
      `LineString coordinates must be an array of at least two positions [x, y]`
    );
  }
}

function validatePolygon(coordinates: Position[][]): void {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length <= 0 ||
    coordinates.some((ring) => {
      return (
        !Array.isArray(ring) ||
        ring.length < 4 ||
        ring.some(
          (point) =>
            !Array.isArray(point) ||
            point.length !== 2 ||
            point.some((coord) => typeof coord !== "number")
        ) ||
        !isClosedRing(ring)
      );
    })
  ) {
    throw new Error(
      `Polygon coordinates must be an array of linear rings, where each ring is an array of at least four positions [x, y] and the first and last positions must be identical`
    );
  }
}

function isClosedRing(ring: Position[]): boolean {
  const firstPoint = ring[0];
  const lastPoint = ring[ring.length - 1];
  return (
    Array.isArray(firstPoint) &&
    Array.isArray(lastPoint) &&
    firstPoint.length === 2 &&
    lastPoint.length === 2 &&
    firstPoint[0] === lastPoint[0] &&
    firstPoint[1] === lastPoint[1]
  );
}

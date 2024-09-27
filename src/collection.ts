import { zCollection } from "../types";

// Fetch collection from JSON file at public/collection.json
// TODO: validate collection using zod type
const collectionJson = await fetch("/collection/collection.json").then((res) =>
  res.json()
);
const collection = zCollection.parse(collectionJson);
export default collection;

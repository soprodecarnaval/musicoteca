import { Collection } from "./types";

// Fetch collection from JSON file at public/collection.json
// TODO: validate collection using zod type
const collectionJson = await fetch("/collection.json").then((res) =>
  res.json()
);
const collection = collectionJson as Collection;
export default collection;

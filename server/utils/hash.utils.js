import { createHash as nodeCreateHash } from "crypto";

// Used only for MongoDB content_hash field storage (dedup constraint).
// NOT used for lookups — all lookups go through HashMap (Map) for O(1).

export const sha256 = (input) => {
  return nodeCreateHash("sha256").update(input, "utf8").digest("hex");
};

export const generateChunkHash = (content) => {
  return sha256(content);
};

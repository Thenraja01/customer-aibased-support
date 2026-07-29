import { Schema } from "mongoose";

/**
 * Reusable plugin that injects multi-tenant organization tracking and common auditing fields
 * into Mongoose schemas. Also ensures optimal compound indexing for multi-tenant queries.
 *
 * Usage:
 *   const mySchema = new mongoose.Schema({ ... });
 *   mySchema.plugin(tenantPlugin);
 */
export default function tenantPlugin(schema, options = {}) {
  // Inject the required organization_id
  if (!schema.path("organization_id")) {
    schema.add({
      organization_id: {

        
        type: Schema.Types.ObjectId,
        ref: "Organization",
      },
    });
  }

  // Common indexes optimized for multi-tenancy sorting
  const hasOrgIndex = schema.indexes().some(
    ([fields]) =>
      Object.keys(fields).length === 1 && fields.organization_id === 1
  );

  if (!hasOrgIndex) {
    schema.index({ organization_id: 1 });
  }
}

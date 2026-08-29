import { Schema } from "mongoose";

/**
 * Soft-delete plugin — adds `deleted`, `deleted_at`, and `deleted_by` fields
 * plus query helpers. Documents are never physically removed; `find()`
 * automatically excludes soft-deleted rows unless `includeDeleted()` is used.
 *
 * Usage:
 *   const mySchema = new mongoose.Schema({ ... });
 *   mySchema.plugin(softDeletePlugin);
 *
 * Queries:
 *   Model.find(...)                       → only non-deleted
 *   Model.find(...).includeDeleted()      → includes deleted
 *   Model.find({ deleted: true })         → only deleted
 *
 * Mutations:
 *   doc.softDelete(userId)               → marks deleted
 *   doc.restore()                        → un-marks deleted
 */
export default function softDeletePlugin(schema, options = {}) {
  const deletedByRef = options.deletedBy === false ? null : { type: Schema.Types.ObjectId, ref: "User" };

  schema.add({
    deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null, index: true },
    deleted_by: deletedByRef,
  });

  // Default scope: exclude soft-deleted documents.
  schema.pre(/^find/, function () {
    if (this.getFilter().deleted === undefined && !this.getOptions().includeDeleted) {
      this.where({ deleted: false });
    }
  });

  schema.query.includeDeleted = function () {
    this.setOptions({ includeDeleted: true });
    return this;
  };

  schema.methods.softDelete = async function (userId = null) {
    this.deleted = true;
    this.deleted_at = new Date();
    if (userId && deletedByRef) this.deleted_by = userId;
    return this.save();
  };

  schema.methods.restore = async function () {
    this.deleted = false;
    this.deleted_at = null;
    this.deleted_by = null;
    return this.save();
  };
}

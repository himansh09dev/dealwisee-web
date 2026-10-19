import { model, Schema, type Types } from "mongoose";

/*
 * Server-side sessions. The cookie carries a random token; only its SHA-256
 * hash is stored, so a database leak doesn't hand out live sessions. The TTL
 * index lets MongoDB delete expired sessions automatically.
 */
const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDoc = { _id: Types.ObjectId; tokenHash: string; userId: Types.ObjectId; expiresAt: Date };
export const SessionModel = model("Session", sessionSchema);

import { roles } from "@pricepilot/contracts";
import { model, Schema, type InferSchemaType, type Types } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // Normalised (trimmed, lowercased) before it reaches the model; unique index enforces one account per email.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Never selected by default, so it can't leak into a response by accident.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: roles, default: "user" },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const UserModel = model("User", userSchema);

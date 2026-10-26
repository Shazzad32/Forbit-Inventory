import mongoose from "mongoose";
import { DEVICE_TYPES, SEND_TO, PURPOSES } from "./constants";

// Same field names (including the `technican_charge` spelling) and the same
// "Devices" model name as the old project, so it reads your existing data.
const schema = new mongoose.Schema({
  device_id: { type: String, unique: true, required: true, trim: true },
  device_model: String,
  device_type: { type: String, enum: DEVICE_TYPES },
  from: String,
  send_to: { type: String, enum: SEND_TO, default: "Store" },
  install_purpose: { type: String, enum: PURPOSES },
  issue_by: String,
  workshop: String,
  problem: String,
  district: String,
  device_price: Number,
  technican_charge: Number,
  insert_date: { type: Date, default: Date.now },
  install_date: Date,
  sending_date: Date,
  is_complete: { type: Boolean, default: false },
});

// Indexes that match how the pages actually query.
schema.index({ send_to: 1, is_complete: 1, insert_date: -1 });
schema.index({ send_to: 1, is_complete: 1, install_date: -1 });

export const Device = mongoose.models.Devices || mongoose.model("Devices", schema);

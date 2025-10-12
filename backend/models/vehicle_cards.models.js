import mongoose from "mongoose";

const vehicleCardSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  numero_immatriculation: { type: String, required: true },
  type: { type: String, required: true },
  type_carburant: { type: String, required: true },
  marque: { type: String, required: true },
  numero_chassis: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const VehicleCard = mongoose.model("VehicleCard", vehicleCardSchema);

export default VehicleCard;

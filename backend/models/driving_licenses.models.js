import mongoose from "mongoose";

const drivingLicenseSchema = new mongoose.Schema({
  client_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  license_number: { 
    type: String, 
    required: true, 
    unique: true // Un permis de conduire est unique !
  },
  categorie: { 
    type: String, 
    required: true 
  },
  issue_date: { 
    type: Date, 
    required: true 
  },
  expiry_date: { 
    type: Date, 
    required: true 
  },
}, { timestamps: true }); // Gère automatiquement createdAt et updatedAt

const DrivingLicense = mongoose.model('DrivingLicense', drivingLicenseSchema);

export default DrivingLicense;
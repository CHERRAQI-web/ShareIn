import mongoose from 'mongoose';

const DocumentArchiveSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  document_type: {
    type: String,
    enum: ['cin', 'permis', 'CIN', 'PERMIS','carte grise','CARTE GRISE'], // Ajout des valeurs en minuscules
    required: true
  },
  average_ai_confidence: {
    type: Number,
    default: 0
  },
  is_human_validated: {
    type: Boolean,
    default: false
  },
  is_corrected_by_human: {
    type: Boolean,
    default: false
  },
   createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const DocumentArchive = mongoose.model('DocumentArchive', DocumentArchiveSchema);

export default DocumentArchive;
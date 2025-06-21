import mongoose from 'mongoose';

const ImportLogSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    totalRecords: { type: Number, required: true },
    importedCount: { type: Number, required: true },
    errors: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now }
});

const ImportLog = mongoose.model('ImportLog', ImportLogSchema);
export default ImportLog; 
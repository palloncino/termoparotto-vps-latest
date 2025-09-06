"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ImportLogSchema = new mongoose_1.default.Schema({
    fileName: { type: String, required: true },
    totalRecords: { type: Number, required: true },
    importedCount: { type: Number, required: true },
    errors: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now },
});
const ImportLog = mongoose_1.default.model('ImportLog', ImportLogSchema);
exports.default = ImportLog;

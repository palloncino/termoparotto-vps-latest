// src/collections/index.ts
import { Schema, model } from 'mongoose';
import { IWorksiteDocument, IWorksiteModel } from '../types';

const worksiteSchema = new Schema<IWorksiteDocument, IWorksiteModel>({
  client_id: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  address: { type: String, required: true },
  description: { type: String, required: false },
  planned_hours: { type: Number, default: 0 },
  end_date: { type: Date },
});

worksiteSchema.statics.updateHours = async function (worksiteId: string, hoursLogged: number) {
  const worksite = await this.findById(worksiteId);
  if (worksite) {
    worksite.planned_hours = Math.max((worksite.planned_hours || 0) - hoursLogged, 0);
    await worksite.save();
  }
};

// Intervention Type Schema (reusable for activities and tasks)
const interventionTypeSchema = new Schema({
  to_quote: { type: Boolean, default: false },
  in_economy: { type: Boolean, default: false },
  site_inspection: { type: Boolean, default: false },
}, { _id: false });

// Material Used Schema for tasks
const materialUsedSchema = new Schema({
  product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
  quantity: Number
}, { _id: false });

// Task Schema inside activities
const taskSchema = new Schema({
  assigned_technician_ids: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  task_description: String,
  work_hours: Number,
  intervention_type: interventionTypeSchema,
  materials_used: [materialUsedSchema]
}, { _id: false });

// Activity Schema
const activitySchema = new Schema({
  client_id: { type: Schema.Types.ObjectId, ref: 'Client' },
  worksite_id: { type: Schema.Types.ObjectId, ref: 'Worksite' },
  activity_description: String,
  completed: Boolean,
  travel_time_hours: Number,
  travel_time: Number,
  valid_travel_time: { type: String, enum: ['manual', 'rules'], default: 'manual' },
  intervention_type: interventionTypeSchema,
  assigned_technician_id: { type: Schema.Types.ObjectId, ref: 'User' },
  tasks: [taskSchema]
}, { _id: false });

// Report Schema
const reportSchema = new Schema({
  date: Date,
  technician_id: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'draft' },
  lunch_location: String,
  short_description: String,
  activities: [activitySchema]
});

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  role: { type: String, enum: ['admin', 'user'] },
  passwordHash: String,
  is_active: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const clientSchema = new Schema({
  name: String,
  address: String,
  contact_info: String
});

const productSchema = new Schema({
  codice_articolo: String,
  codice_fornitore: String,
  descrizione_articolo: String,
  prezzo_listino: Number,
  prezzo_acquisto: Number,
  prezzo_concosti: Number,
  prezzo_cliente: Number,
  prezzo_iva10: Number,
  prezzo_iva22: Number,
  data_acquisto: String,
  settore: String,
  marca: String,
  macrosettore: String,
  famiglie: String,
  listino: Number,
  scontato: Number,
  con_spese_generali: Number,
  con_ricarico: Number,
  iva_al_10: Number,
  vendita_al_22: Number,
  uso: String,
  field_1: String,
  field_2: String,
  field_3: String
});

// Create and export models
export const User = model('User', userSchema);
export const Client = model('Client', clientSchema);
export const Worksite = model<IWorksiteDocument, IWorksiteModel>('Worksite', worksiteSchema);
export const Product = model('Product', productSchema);
export const Report = model('Report', reportSchema);

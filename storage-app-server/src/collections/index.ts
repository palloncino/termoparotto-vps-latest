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

worksiteSchema.statics.updateHours = async function (
  worksiteId: string,
  hoursLogged: number
) {
  const worksite = await this.findById(worksiteId);
  if (worksite) {
    worksite.planned_hours = Math.max(
      (worksite.planned_hours || 0) - hoursLogged,
      0
    );
    await worksite.save();
  }
};

// Intervention Type Schema (reusable for activities and tasks)
const interventionTypeSchema = new Schema(
  {
    da_preventivo: { type: Boolean, default: false },
    in_economia: { type: Boolean, default: false },
    sopralluogo: { type: Boolean, default: false },
  },
  { _id: false }
);

// Material Used Schema for tasks
const materialUsedSchema = new Schema(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
  },
  { _id: false }
);

// Task Schema inside activities
const taskSchema = new Schema(
  {
    assigned_technician_ids: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    task_description: String,
    work_hours: Number,
    intervention_type: interventionTypeSchema,
    materials_used: [materialUsedSchema],
    material_unloading: { type: Boolean, default: false },
    material_unloading_hours: { 
      type: Number, 
      default: 0,
      min: 0,
      set: function(value: number) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
      }
    },
  },
  { _id: false }
);

// Activity Schema
const activitySchema = new Schema(
  {
    client_id: { type: Schema.Types.ObjectId, ref: 'Client' },
    worksite_id: { type: Schema.Types.ObjectId, ref: 'Worksite' },
    completed: Boolean,
    travel_time_hours: Number,
    travel_time: Number,
    valid_travel_time: {
      type: String,
      enum: ['manual', 'rules'],
      default: 'manual',
    },
    intervention_type: interventionTypeSchema,
    assigned_technician_id: { type: Schema.Types.ObjectId, ref: 'User' },
    tasks: [taskSchema],
  },
  { _id: false }
);

// Report Schema
const reportSchema = new Schema({
  date: Date,
  technician_id: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'draft' },
  lunch_location: String,
  activities: [activitySchema],
  created: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
});

// Pre-save middleware to validate material unloading data
reportSchema.pre('save', function(next) {
  if (this.activities && Array.isArray(this.activities)) {
    this.activities.forEach(activity => {
      if (activity.tasks && Array.isArray(activity.tasks)) {
        activity.tasks.forEach(task => {
          // Ensure material_unloading_hours is 0 if material_unloading is false
          if (task.material_unloading === false) {
            task.material_unloading_hours = 0;
          }
          // Ensure material_unloading_hours is non-negative
          if (task.material_unloading_hours < 0) {
            task.material_unloading_hours = 0;
          }
        });
      }
    });
  }
  next();
});

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  role: { type: String, enum: ['admin', 'user'] },
  passwordHash: String,
  is_active: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  hourly_cost: {
    type: Number,
    default: 0,
    min: 0,
    set: function(value: number) {
      return Math.round((value + Number.EPSILON) * 100) / 100;
    }
  },
  createdAt: { type: Date, default: Date.now },
});

const clientSchema = new Schema({
  name: String,
  address: String,
  contact_info: String,
});

const productSchema = new Schema({
  data_documento: String,
  descrizione: String,
  descrizione_interna: String,
  fornitore: String,
  unit_of_measure: {
    type: String,
    default: 'pz',
    enum: ['pz', 'kg', 'm', 'l', 'm²', 'm³', 'cm', 'mm', 'km', 'g', 't', 'ml', 'cl', 'dl']
  },
  prezzo_acquisto: {
    type: Number,
    set: function(value: number) {
      return Math.round((value + Number.EPSILON) * 100) / 100;
    }
  },
  utile: {
    type: Number,
    set: function(value: number) {
      return Math.round((value + Number.EPSILON) * 100) / 100;
    }
  },
  imponibile: {
    type: Number,
    set: function(value: number) {
      return Math.round((value + Number.EPSILON) * 100) / 100;
    }
  },
  iva_10: {
    type: Number,
    set: function(value: number) {
      return Math.round((value + Number.EPSILON) * 100) / 100;
    }
  },
  iva_22: {
    type: Number,
    set: function(value: number) {
      return Math.round((value + Number.EPSILON) * 100) / 100;
    }
  },
});

// Create and export models
export const User = model('User', userSchema);
export const Client = model('Client', clientSchema);
export const Worksite = model<IWorksiteDocument, IWorksiteModel>(
  'Worksite',
  worksiteSchema
);
export const Product = model('Product', productSchema);
export const Report = model('Report', reportSchema);

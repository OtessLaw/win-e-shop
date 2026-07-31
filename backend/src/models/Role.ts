import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  name: string;        // e.g. "products:create"
  label: string;       // Human-readable label
  group: string;       // e.g. "Products", "Orders"
}

export interface IRole extends Document {
  name: string;        // e.g. "super_admin"
  label: string;       // e.g. "Super Admin"
  permissions: mongoose.Types.ObjectId[];
  isSystem: boolean;   // System roles cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true },
    group: { type: String, required: true },
  },
  { timestamps: true }
);

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    label: { type: String, required: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Permission = mongoose.model<IPermission>('Permission', permissionSchema);
export const Role = mongoose.model<IRole>('Role', roleSchema);

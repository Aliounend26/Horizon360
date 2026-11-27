import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  user?: Types.ObjectId;
  userLabel: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: any;
  after?: any;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    userLabel: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);

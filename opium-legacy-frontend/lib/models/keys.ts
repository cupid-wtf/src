import mongoose, { Document, Schema } from 'mongoose';

export interface Keys extends Document {
    key: string;
    createdby: string;
    createdAt: Date;
}
const keySchema = new Schema<Keys>({
  key: { type: String, required: true },
  createdby: { type: String, required: true },
}, { timestamps: true });
const keyModel = mongoose.models.keys || mongoose.model<Keys>('Keys', keySchema);

export default keyModel;

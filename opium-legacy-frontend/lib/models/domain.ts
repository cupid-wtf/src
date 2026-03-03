import mongoose, { Document, Schema } from 'mongoose';

export interface Domain extends Document {
    url: string;   
    donated: 'True' | 'False';
    active: 'True' | 'False'
  createdAt: Date;
}

const domainSchema = new Schema<Domain>({
  url: { type: String, required: true, unique: true },
  donated: { type: String, enum: ['True', 'False'], default: 'False' },
  active: { type: String, enum: ['True', 'False'], default: 'True' },

}, { timestamps: true });

// Avoid overwriting the model
const DomainModel = mongoose.models.Domains || mongoose.model<Domain>('Domains', domainSchema);

export default DomainModel;

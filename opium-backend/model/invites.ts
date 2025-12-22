import mongoose, { Schema } from "mongoose";
export interface Invites extends Document {
    key: string;
    addedby: string;
    usedby: string;
    createdon: Date;
    // expireson: Date;
    usedon: Date;
    status: "unused" | "used" /* | "expired" */;
  }
const invitesSchema = new Schema<Invites>(
    {
      key: { type: String, required: false },
      addedby: { type: String, required: false },
      usedby: {type: String, required: false },
      createdon: {type: Date, required: false },
      // expireson: {type: Date, required: true },
      usedon: {type: Date, required: false },  
      status: {   
        type: String, 
        enum: ["unused", "used", /* "expired" */], 
        default: "unused" 
      }  
    },
  );
  const InvitesModel = mongoose.models.Invites || mongoose.model<Invites>("Invites", invitesSchema);
  
  export default InvitesModel;
  
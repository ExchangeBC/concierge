import { createdAtSchema } from 'back-end/lib/schemas';
import * as mongoose from 'mongoose';

interface ResponseUser {
    id: mongoose.Types.ObjectId;
    name: string;
    email: string;
}

export interface Data {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    rfiId: mongoose.Types.ObjectId;
    userId: ResponseUser;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
    createdAt: createdAtSchema,
    rfiId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    user: mongoose.Schema.Types.Mixed
});

export type DiscoveryDayResponse = Data;

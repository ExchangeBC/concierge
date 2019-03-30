import { dateSchema, userIdSchema } from 'back-end/lib/schemas';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import { AppSession } from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import * as mongoose from 'mongoose';
import { PublicRfiResponse } from 'shared/lib/resources/request-for-information/response';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  rfi: mongoose.Types.ObjectId;
  attachments: mongoose.Types.ObjectId[];
}

export async function makePublicRfiResponse(RfiModel: RfiSchema.Model, UserModel: UserSchema.Model, FileModel: FileSchema.Model, rfiResponse: Data, session: AppSession): Promise<PublicRfiResponse> {
  const createdBy = await UserSchema.findPublicUserByIdUnsafely(UserModel, rfiResponse.createdBy);
  const rfi = await RfiSchema.findPublicRfiByIdUnsafely(RfiModel, UserModel, FileModel, rfiResponse.rfi, session);
  const attachments = await Promise.all(rfiResponse.attachments.map(fileId => FileSchema.findPublicFileByIdUnsafely(FileModel, fileId)));
  return {
    _id: rfiResponse._id.toString(),
    createdAt: rfiResponse.createdAt,
    createdBy,
    rfi,
    attachments
  };
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  createdBy: userIdSchema(true),
  rfi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rfi',
    required: true
  },
  attachments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'File',
    required: true
  }
});

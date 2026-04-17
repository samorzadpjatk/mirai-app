import { builder } from "../../builder.js";

/**
 * File/Storage Types
 */

const FileDownloadPayloadType = builder.objectType("FileDownloadPayload", {
  description: "Payload for file download URL",
  fields: (t) => ({
    signedUrl: t.exposeString("signedUrl", { nullable: true }),
    expiresAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (parent: { expiresAt?: Date | null }) =>
        parent.expiresAt ?? null,
    }),
  }),
});

const CreateDownloadUrlInput = builder.inputType("CreateDownloadUrlInput", {
  description: "Input for creating a download URL",
  fields: (t) => ({
    storagePath: t.field({ type: "String", required: true }),
  }),
});

const FileUploadPayloadType = builder.objectType("FileUploadPayload", {
  description: "Payload for file upload URL",
  fields: (t) => ({
    signedUrl: t.exposeString("signedUrl", { nullable: true }),
    storagePath: t.exposeString("storagePath", { nullable: true }),
    expiresAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (parent: { expiresAt?: Date | null }) =>
        parent.expiresAt ?? null,
    }),
  }),
});

const CreateUploadUrlInput = builder.inputType("CreateUploadUrlInput", {
  description: "Input for creating an upload URL",
  fields: (t) => ({
    filename: t.field({ type: "String", required: true }),
    contentType: t.field({ type: "String" }),
  }),
});

export {
  FileDownloadPayloadType,
  CreateDownloadUrlInput,
  FileUploadPayloadType,
  CreateUploadUrlInput,
};

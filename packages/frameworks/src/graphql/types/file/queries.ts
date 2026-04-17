import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import {
  FileDownloadPayloadType,
  CreateDownloadUrlInput,
  FileUploadPayloadType,
  CreateUploadUrlInput,
} from "./types.js";

/**
 * GraphQL Context type for file operations
 */
interface FileOperationContext {
  controllers: {
    storageController: {
      createDownloadUrl: (input: unknown) => Promise<
        | {
            success: true;
            data: { signedUrl: string; expiresAt: string };
          }
        | { success: false; error: string; code?: "NOT_FOUND" }
      >;
      createUploadUrl: (input: unknown) => Promise<
        | {
            success: true;
            data: {
              resumableUrl: string;
              token: string;
              bucket: string;
              objectPath: string;
              storagePath: string;
            };
          }
        | { success: false; error: string }
      >;
    };
  };
  authContext?: {
    userId: string;
    role: string;
  };
}

/**
 * File Queries
 */
builder.queryFields((t) => ({
  /**
   * Create a signed URL for downloading a file
   */
  createDownloadUrl: t.field({
    type: FileDownloadPayloadType,
    args: {
      input: t.arg({ type: CreateDownloadUrlInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          storagePath: string;
        };
      },
      ctx: FileOperationContext,
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.storageController;
      const result = await controller.createDownloadUrl({
        storagePath: args.input.storagePath,
        expiresInSeconds: 600, // 10 minutes default
      });

      if (!result.success) {
        if (result.code === "NOT_FOUND") {
          throw new GraphQLError("File not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        signedUrl: result.data.signedUrl,
        expiresAt: new Date(result.data.expiresAt),
      };
    },
  }),
}));

/**
 * File Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a signed URL for uploading a file
   */
  createUploadUrl: t.field({
    type: FileUploadPayloadType,
    args: {
      input: t.arg({ type: CreateUploadUrlInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          filename: string;
          contentType?: string | null;
        };
      },
      ctx: FileOperationContext,
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.storageController;

      // Generate storage path for the upload
      const timestamp = Date.now();
      const storagePath = `files-private/uploads/${ctx.authContext.userId}/${timestamp}-${args.input.filename}`;

      const result = await controller.createUploadUrl({
        storagePath,
        upsert: true,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Calculate expiration (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      return {
        signedUrl: result.data.resumableUrl,
        storagePath: result.data.storagePath,
        expiresAt,
      };
    },
  }),
}));

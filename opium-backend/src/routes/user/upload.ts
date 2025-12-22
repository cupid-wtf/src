import Elysia, { t } from "elysia";
import path from "path";
import { v4 } from "uuid";
import s3 from "../../../utils/s3";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { jwtplugin } from "../../../plugins/jwt";
import Database from "../../../utils/db";
import UserModel from "../../../model/user";

const imageTypesArray = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/webp'
];

const videoTypesArray = [
  'video/mp4', 
  'video/webm'
];

export const UploadAvatar = new Elysia()
  .use(jwtplugin)
  .post("/avatar", async ({ body, set, user }) => {
    const { file } = body;
    try {
      if (!file) return { success: false, message: "No file provided" };
      if (!imageTypesArray.includes(file.type)) return { success: false, message: "Invalid file type. Only image files are allowed." };

      await Database.init();
      const fileid = `${v4()}${path.extname(file.name)}`;
      const filename = `avatars/${fileid}`;
      const usr = await UserModel.findById(user._id);

      if (usr.config.avatar) {
        const currentfile = usr.config.avatar.replace("https://r2.opium.bio/", "");
        try {
          await s3.s3?.send(new DeleteObjectCommand({ Bucket: 'opium', Key: currentfile }));
          await UserModel.findByIdAndUpdate(user._id, { "config.avatar": "" });
        } catch (error) {
          return { success: false, message: "Error deleting old avatar" };
        }
      }

      await s3.s3?.send(new PutObjectCommand({
        Bucket: 'opium',
        Key: filename,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      }));

      await UserModel.findByIdAndUpdate(user._id, { "config.avatar": `https://r2.opium.bio/${filename}` });
      return { success: true, message: "Avatar uploaded successfully", url: `https://r2.opium.bio/${filename}` };
    } catch (error) {
      set.status = 500;
      return { success: false, message: "An internal server error has occurred" };
    }
  }, {
    body: t.Object({
      file: t.File({ maxSize: "80m", mimetype: imageTypesArray })
    }),
  })
  .delete("/avatar", async ({ user, set }) => {
    try {
      await Database.init();
      const usr = await UserModel.findById(user._id);
      const avatarUrl = usr.config.avatar;
      const fileKey = `avatars/${avatarUrl.split('/').pop()}`;
      await s3.s3?.send(new DeleteObjectCommand({ Bucket: "opium", Key: fileKey }));
      await UserModel.findByIdAndUpdate(user._id, { "config.avatar": null });
      return { success: true, message: "Avatar deleted successfully" };
    } catch (error) {
      set.status = 500;
      return { success: false, message: "An internal server error has occurred" };
    }
  })
  .post("/banner", async ({ body, set, user }) => {
    const { file } = body;
    try {
      if (!file) return { success: false, message: "No file provided" };
      if (!imageTypesArray.includes(file.type)) return { success: false, message: "Invalid file type. Only image files are allowed." };

      await Database.init();
      const fileid = `${v4()}${path.extname(file.name)}`;
      const filename = `banners/${fileid}`;
      const usr = await UserModel.findById(user._id);

      if (usr.config.banner) {
        const currentfile = usr.config.banner.replace("https://r2.opium.bio/", "");
        try {
          await s3.s3?.send(new DeleteObjectCommand({ Bucket: 'opium', Key: currentfile }));
          await UserModel.findByIdAndUpdate(user._id, { "config.banner": "" });
        } catch (error) {
          return { success: false, message: "Error deleting old banner" };
        }
      }

      await s3.s3?.send(new PutObjectCommand({
        Bucket: 'opium',
        Key: filename,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      }));

      await UserModel.findByIdAndUpdate(user._id, { "config.banner": `https://r2.opium.bio/${filename}` });
      return { success: true, message: "Banner uploaded successfully", url: `https://r2.opium.bio/${filename}` };
    } catch (error) {
      set.status = 500;
      return { success: false, message: "An internal server error has occurred" };
    }
  }, {
    body: t.Object({
      file: t.File({ maxSize: "80m", mimetype: imageTypesArray })
    }),
  })
  .delete("/banner", async ({ user, set }) => {
    try {
      await Database.init();
      const usr = await UserModel.findById(user._id);
      const bannerUrl = usr.config.banner;
      const fileKey = `banners/${bannerUrl.split('/').pop()}`;
      await s3.s3?.send(new DeleteObjectCommand({ Bucket: "opium", Key: fileKey }));
      await UserModel.findByIdAndUpdate(user._id, { "config.banner": null });
      return { success: true, message: "Banner deleted successfully" };
    } catch (error) {
      set.status = 500;
      return { success: false, message: "An internal server error has occurred" };
    }
  })
  .post("/background", async ({ body, set, user }) => {
    try {
      const { file } = body;
      if (!file) return { success: false, message: "No file provided" };
      if (!imageTypesArray.includes(file.type) && !videoTypesArray.includes(file.type)) return { success: false, message: "Invalid file type. Only image or video files are allowed." };

      await Database.init();
      const fileid = `${v4()}${path.extname(file.name)}`;
      const filename = `backgrounds/${fileid}`;
      const usr = await UserModel.findById(user._id);

      if (usr.config.background.url) {
        const currentfile = usr.config.background.url.replace("https://r2.opium.bio/", "");
        try {
          await s3.s3?.send(new DeleteObjectCommand({ Bucket: 'opium', Key: currentfile }));
          await UserModel.findByIdAndUpdate(user._id, { "config.background.url": "", "config.background.type": "" });
        } catch (error) {
          return { success: false, message: "Error deleting old background" };
        }
      }

      await s3.s3?.send(new PutObjectCommand({
        Bucket: 'opium',
        Key: filename,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      }));

      const fileCategory = file.type.startsWith('video/') ? 'video' : 'image';
      await UserModel.findByIdAndUpdate(user._id, {
        "config.background.url": `https://r2.opium.bio/${filename}`,
        "config.background.type": fileCategory,
      });

      return { success: true, message: "Background uploaded successfully", url: `https://r2.opium.bio/${filename}` };
    } catch (error) {
      set.status = 500;
      return { success: false, message: "An internal server error has occurred" };
    }
  }, {
    body: t.Object({
      file: t.File({ maxSize: "100m", mimetype: t.Union([...imageTypesArray.map(type => t.Literal(type)), ...videoTypesArray.map(type => t.Literal(type))]) })
    }),
  })
  .delete("/background", async ({ user, set }) => {
    try {
      await Database.init();
      const usr = await UserModel.findById(user._id);
      if (!usr?.config?.background?.url) {
        set.status = 404;
        return { success: false, message: "No background found to delete" };
      }

      const backgroundUrl = usr.config.background.url;
      const filename = backgroundUrl.split('/').pop();
      const fileKey = `backgrounds/${filename}`;

      await s3.s3?.send(new DeleteObjectCommand({ Bucket: "opium", Key: fileKey }));
      await UserModel.findByIdAndUpdate(user._id, { "config.background.url": "", "config.background.type": "" });
      return { success: true, message: "Background deleted successfully" };
    } catch (error) {
      set.status = 500;
      return { success: false, message: "An internal server error has occurred" };
    }
  });

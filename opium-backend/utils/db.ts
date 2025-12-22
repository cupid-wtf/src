import mongoose from "mongoose";
import Config from "./config";

class Database {
  public static db: mongoose.Connection | null = null;

  public static init = async () => {
      try {
          await Config.load('config.toml');
          const url = Config.get<string>("mongodb", "url");
          this.db = (await mongoose.connect(url)).connection;
          return true;
      } catch (error) {
          return false;
      }
  };
}

export default Database
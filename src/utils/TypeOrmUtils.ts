import * as fs from "fs";
import * as path from "path";
import { createConnection, createConnections } from "typeorm";
import { LoggerUtility } from "./LoggerUtility";

export class TypeOrmUtils {

    public static init(): Promise<any> {
        let connectionFunction;
        if (fs.existsSync("../../ormconfig.json")) {
            LoggerUtility.info("TypeORM: Found ormconfig.json file in root folder.");
            connectionFunction = createConnection();
        } else {
            const specDir = path.join(__dirname, "../../src/assets/ormconfig.json");
            if (fs.existsSync(specDir)) {
                const specDB = fs.readFileSync(specDir, "utf8");
                const dbConf = JSON.parse(specDB);
                dbConf[0].entities = [];
                if (process.env.NODE_ENV === "production") {
                    LoggerUtility.info("TypeORM: Working with JS files");
                    dbConf[0].entities.push("dist/databases/entities/**/*.js");
                } else {
                    LoggerUtility.info("TypeORM: Working with TS files");
                    dbConf[0].entities.push("src/databases/entities/**/*.ts");
                }
                const password = process.env.DB_PASSWORD;
                const user = process.env.DB_USER;
                dbConf[0].username = user;
                dbConf[0].password = password;
                connectionFunction = createConnections(dbConf);
            } else {
                LoggerUtility.warn("TypeORM: Cannot find typeorm configuration.");
                connectionFunction = new Promise((resolve, reject) => {
                    resolve(true);
                });
            }
        }
        LoggerUtility.info("TypeORM: configuration finished!");
        return connectionFunction;
    }
}

"use strict";
import bodyParser from "body-parser";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import * as helmet from "helmet";
import { KeyCloakUtils } from "./utils/keycloak/KeyCloakUtils";
import { LoggerUtility } from "./utils/LoggerUtility";
import { SwaggerUtils } from "./utils/SwaggerUtils";
import { TypeOrmUtils } from "./utils/TypeOrmUtils";

// From TypeORM
import "reflect-metadata";

dotenv.config();
const app = express();

// Allow cross origin
// require("./utils/cors-util")(app);

// Enable JWT tokens
// require("./utils/jwt-util").addJWT(app, SWAGGER_BASE_PATH);

app.use(bodyParser.json());
app.use(cors());
app.use(helmet.xssFilter());
app.use(helmet.frameguard());

TypeOrmUtils.init()
.then(async () => {
    KeyCloakUtils.init(app);
    SwaggerUtils.init(app);
})
.catch((error) => {
    LoggerUtility.error("TYPEORM: Error connecting with DB.");
    LoggerUtility.error(error);
    process.exit(1);
});

export default app;

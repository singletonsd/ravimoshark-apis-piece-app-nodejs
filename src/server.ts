"use strict";

import http from "http";
import normalizePort from "normalize-port";
import app from "./app";
import { LoggerUtility } from "./utils/LoggerUtility";

const serverPort = normalizePort(process.env.APP_PORT || 8000);
// Start the server
http.createServer(app).listen(serverPort, () => {
    LoggerUtility.debug("App running at http://localhost:" + serverPort);
    LoggerUtility.debug("________________________________________________________________");
    LoggerUtility.debug("API docs (Swagger UI) available on http://localhost:" + serverPort + "/docs");
    LoggerUtility.debug("________________________________________________________________");
});

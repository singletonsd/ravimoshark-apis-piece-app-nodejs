import * as express from "express";
import * as fs from "fs";
import jsyaml from "js-yaml";
import swaggerTools from "oas-tools";
import * as path from "path";
import swaggerUi from "swagger-ui-express";
import { LoggerUtility } from "./LoggerUtility";

export class SwaggerUtils {

    public static init(app: express.Express): void {
        // swaggerRouter configuration
        const options = {
            controllers: path.join(__dirname, "../controllers"),
            docs: {
                apiDocs: "/api-docs",
                apiDocsPrefix: "",
                swaggerUi: "/docs",
                swaggerUiPrefix: ""
            },
            loglevel: "info",
            strict: false,
            validator: true
        };

        app.use("/swagger", swaggerUi.serve, swaggerUi.setup(this.getSwaggerDoc()));
        swaggerTools.configure(options);
        swaggerTools.initialize(this.swaggerDoc, app, () => {
            LoggerUtility.debug("Swagger OAS: middleware initialized.");
        });
    }

    public static getSwaggerDoc(): any {
        if (!this.swaggerDoc) {
            this.readFile();
        }
        return this.swaggerDoc;
    }

    private static swaggerDoc;

    private static readFile() {
        // TODO: change the path of the documentation to URL of gitlab.
        const spec = fs.readFileSync(path.join(__dirname, "../../src/api/swagger.yaml"), "utf8");
        this.swaggerDoc = jsyaml.safeLoad(spec);
        const servers: Array<{ url: string}> = this.swaggerDoc.servers;
        if (process.env.SWAGGER_URL) {
            LoggerUtility.info("Swagger OAS: Found environment URL", process.env.SWAGGER_URL);
            servers.unshift({ url: process.env.SWAGGER_URL });
        }
        if (process.env.APP_PORT) {
            LoggerUtility.info("Swagger OAS: Found APP_PORT env", process.env.APP_PORT);
            servers.unshift({ url: `http://localhost:${process.env.APP_PORT}` });
        }
    }

}

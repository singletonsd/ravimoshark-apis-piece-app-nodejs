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
            LoggerUtility.debug("Swagger OAS middleware initialized.");
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

        if (process.env.SWAGGER_HOST) {
            this.swaggerDoc.host = process.env.SWAGGER_HOST;
        }

        if (process.env.SWAGGER_URL) {
            LoggerUtility.info("Found environment URL", process.env.SWAGGER_URL);
            const servers: Array<{ url: string}> = this.swaggerDoc.servers;
            servers.unshift({ url: process.env.SWAGGER_URL });
        }
    }

}

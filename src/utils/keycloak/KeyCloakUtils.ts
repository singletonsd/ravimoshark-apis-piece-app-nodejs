import * as express from "express";
import session from "express-session";
import * as fs from "fs";
import jsyaml from "js-yaml";
import KeyCloak from "keycloak-connect";
import Keycloak from "keycloak-connect";
import * as path from "path";
import request from "request-promise";
import UrlPattern from "url-pattern";
import { LoggerUtility } from "../LoggerUtility";
import { SwaggerUtils } from "../SwaggerUtils";
import { ResponsePayload } from "../writer";
import { KeyCloakPermissions, Permissions } from "./KeyCloakPermissions";

export class KeyCloakUtils {

    public static readonly PERMISSIONS = new KeyCloakPermissions([
        // ["/customers", "post", "res:customer", "scopes:create"],
        // ["/customers(*)", "get", "res:customer", "scopes:view"],
        // ["/campaigns", "post", "res:campaign", "scopes:create"],
        // ["/campaigns(*)", "get", "res:campaign", "scopes:view"],
        // ["/reports", "post", "res:report", "scopes:create"],
        // ["/reports(*)", "get", "res:report", "scopes:view"]
    ]).notProtect(
        "/swagger(*)",
        "/docs(*)",
        "/api-docs"
    );

    public static init(app: express.Express): void {
        this.readSecuritySchemes();
        const keyCloakPath = path.join(__dirname, "../../../src/assets/keycloak.json");
        if (fs.existsSync(keyCloakPath)) {
            LoggerUtility.info("Configuration auth server...");
            const keyCloakConfig = jsyaml.safeLoad(fs.readFileSync(keyCloakPath, "utf8"));
            if (process.env.KEYCLOAK_URL) {
                keyCloakConfig.serverUrl = process.env.KEYCLOAK_URL;
                LoggerUtility.info(`Setting server url ${keyCloakConfig.serverUrl}`);
            }
            if (process.env.KEYCLOAK_PUBLIC_KEY) {
                LoggerUtility.info(`Adding public key...`);
                keyCloakConfig.realmPublicKey = process.env.KEYCLOAK_PUBLIC_KEY;
            } else {
                LoggerUtility.error("NOT FOUND KEYCLOAK_PUBLIC_KEY variable");
                process.exit(1);
            }
            const memoryStore = new session.MemoryStore();
            app.use(session({
                resave: false,
                saveUninitialized: true,
                secret: process.env.KEYCLOAK_PUBLIC_KEY,
                store: memoryStore
            }));
            this.keycloak = new KeyCloak({ store: memoryStore}, keyCloakConfig);
            this.keycloakProtect = this.keycloak.protect();
            this.entitlementUrl = this.createEntitlementUrl();
            const handler = this.keycloak.middleware();
            app.use(handler);
            app.use(this.createSecurityMiddleware());
            app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
                if (this.PERMISSIONS.isNotProtectedUrl(req)) {
                    return next();
                }
                const permission = this.PERMISSIONS.findPermission(req);
                if (!permission) {
                    LoggerUtility.warn(`Can not find a permission for: ${req.method} ${req.originalUrl}`);
                    return this.keycloak.accessDenied(req, res);
                }
                this.protectAndCheckPermission(req, res, next, permission);
            });
        } else {
            LoggerUtility.warn("Cannot find keycloak configuration file.");
        }
    }

    public static createSecurityMiddleware(): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (this.PERMISSIONS.isNotProtectedUrl(req)) {
                return next();
            }
            const permission = this.PERMISSIONS.findPermission(req);
            if (!permission) {
                LoggerUtility.warn(`Can not find a permission for: ${req.method} ${req.originalUrl}`);
                return ResponsePayload.response401(res);
            }
            this.protectAndCheckPermission(req, res, next, permission);
        };
    }

    private static keycloak: Keycloak;
    private static keycloakProtect: express.RequestHandler;
    private static entitlementUrl: string;

    private static readSecuritySchemes() {
        // const securitySchemes: object = SwaggerUtils.getSwaggerDoc().components.securitySchemes;
        // for (const key in securitySchemes) {
        //     if (key) {
        //         const schema = securitySchemes[key];
        //         if (typeof schema === "object" && schema.type === "oauth2") {
        //             for (const keyPermission in schema.flows.implicit.scopes) {
        //                 if (keyPermission) {
        //                     console.log(keyPermission);
        //                 }
        //             }
        //         }
        //     }
        // }
        const paths: object = SwaggerUtils.getSwaggerDoc().paths;
        for (const customPath in paths) {
            if (customPath) {
                const pathProperties = paths[customPath];
                for (const req in pathProperties) {
                    if (req && pathProperties[req].security) {
                        const securitySchemas = paths[customPath][req].security;
                        for (const sec in securitySchemas) {
                            if (paths[customPath][req].security[sec]) {
                                for (const scope in securitySchemas[sec]) {
                                    if (securitySchemas[sec][scope] && securitySchemas[sec][scope].length > 0) {
                                        console.log(customPath, req, securitySchemas[sec][scope]);
                                        this.PERMISSIONS.addPermission(
                                            { method: req, resource: "", scope: securitySchemas[sec][scope]
                                                , url: new UrlPattern(customPath + "(*)")});
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private static protectAndCheckPermission(req: express.Request, response: express.Response
                                        ,    next: express.NextFunction, permission: Permissions) {
        this.keycloakProtect(req, response, () => this.checkPermission(req, permission)
            .then(() => next()).catch((error) => {
                LoggerUtility.error(`access denied: ${error.message}`);
                this.keycloak.accessDenied(req, response);
            }));
    }

    private static checkPermission(req: express.Request, permission: Permissions) {
        const scopes = [permission.scope];
        return this.getAccessToken(req)
            .then((accessToken) =>
            this.checkEntitlementRequest(permission.resource, scopes, accessToken));
    }

    private static getAccessToken(req: express.Request) {
        const tokens = this.keycloak.stores[1].get(req);
        const result = tokens && tokens.access_token;
        return result ? Promise.resolve(result) : Promise.reject("There is not token.");
    }

    private static checkEntitlementRequest(resource, scopes, accessToken) {
        const permission = {
            resource_set_name: resource,
            scopes
        };
        const jsonRequest = {
            permissions: [permission]
        };
        const options = {
            auth: {
                bearer: accessToken
            },
            body: jsonRequest,
            headers: {
                Accept: "application/json"
            },
            json: true,
            method: "POST",
            url: this.entitlementUrl
        };

        return request(options);
    }

    private static createEntitlementUrl() {
        return `${this.keycloak.config.realmUrl}/authz/entitlement/${this.keycloak.config.clientId}`;
    }
}

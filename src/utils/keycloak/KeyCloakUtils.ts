import { NextFunction, Request, RequestHandler, Response } from "express";
import * as core from "express-serve-static-core";
import session from "express-session";
import * as fs from "fs";
import jsyaml from "js-yaml";
import Keycloak from "keycloak-connect";
import * as path from "path";
import request from "request-promise";
import UrlPattern from "url-pattern";
import { LoggerUtility } from "../LoggerUtility";
import { SwaggerUtils } from "../SwaggerUtils";
import { ResponsePayload } from "../writer";
import { KeyCloakPermissions, Permissions } from "./KeyCloakPermissions";

// TODO: get public key from Keycloak server.

export class KeyCloakUtils {

    public static readonly PERMISSIONS = new KeyCloakPermissions([
    ]).notProtect(
        "/swagger(*)",
        "/docs(*)",
        "/api-docs"
    );

    public static init(app: core.Express): void {
        this.readSecuritySchemes();
        const keyCloakPath = path.join(__dirname, "../../../src/assets/keycloak.json");
        if (fs.existsSync(keyCloakPath)) {
            LoggerUtility.info("Configuration auth server...");
            this.keyCloakConfig = jsyaml.safeLoad(fs.readFileSync(keyCloakPath, "utf8"));
            if (process.env.KEYCLOAK_URL) {
                this.keyCloakConfig["auth-server-url"] = process.env.KEYCLOAK_URL;
                LoggerUtility.info(`Setting server url ${this.keyCloakConfig["auth-server-url"]}`);
            } else if (process.env.NODE_ENV !== "development") {
                LoggerUtility.warn(`NOT FOUND KEYCLOAK_URL variable, using default value ${this.keyCloakConfig["auth-server-url"]}`);
                process.exit(1);
            }
            if (process.env.KEYCLOAK_PUBLIC_KEY) {
                LoggerUtility.info(`Adding public key...`);
                this.keyCloakConfig["realm-public-key"] = process.env.KEYCLOAK_PUBLIC_KEY;
            } else {
                LoggerUtility.error("NOT FOUND KEYCLOAK_PUBLIC_KEY variable");
                process.exit(1);
            }
            if (process.env.KEYCLOAK_CLIENT_SECRET) {
                LoggerUtility.info(`Adding client secret...`);
                this.keyCloakConfig.credentials = {};
                this.keyCloakConfig.credentials.secret = process.env.KEYCLOAK_CLIENT_SECRET;
            } else {
                LoggerUtility.error("NOT FOUND KEYCLOAK_CLIENT_SECRET variable");
                process.exit(1);
            }
            this.memoryStore = new session.MemoryStore();
            app.use(session({
                resave: false,
                saveUninitialized: true,
                secret: process.env.KEYCLOAK_PUBLIC_KEY,
                store: this.memoryStore
            }));
            this.keycloak = new Keycloak({ store: this.memoryStore }, this.keyCloakConfig);
            this.entitlementUrl = this.createEntitlementUrl();
            this.keycloak.redirectToLogin = () => false;
            this.keycloak.accessDenied = (req, res) => {
                ResponsePayload.response401(res);
                LoggerUtility.error(`Not authenticated access for: ${req.method} ${req.originalUrl}`);
            };
            const handler = this.keycloak.middleware();
            app.use(handler);
            app.use(this.createSecurityMiddleware());
            this.keycloakProtect = this.keycloak.protect();
        } else {
            LoggerUtility.warn("Cannot find keycloak configuration file.");
        }
    }

    public static createSecurityMiddleware(): RequestHandler {
        return (req: Request, res: Response, next: NextFunction) => {
            if (this.PERMISSIONS.isNotProtectedUrl(req)) {
                return next();
            }
            const permission = this.PERMISSIONS.findPermission(req);
            if (!permission) {
                LoggerUtility.warn(`Can not find a permission for: ${req.method} ${req.originalUrl}`);
                return ResponsePayload.response401(res);
            }
            LoggerUtility.debug(`Found permissions: ${req.originalUrl}, ${permission.method}, ${permission.scope}`);
            this.protectAndCheckPermission(req, res, next, permission);
        };
    }

    private static keycloak: Keycloak;
    private static keycloakProtect: RequestHandler;
    private static entitlementUrl: string;
    private static memoryStore: session.MemoryStore;
    private static keyCloakConfig: any;

    private static readSecuritySchemes() {
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
                                        this.PERMISSIONS.addPermission(
                                            { method: req.toUpperCase()
                                            , resource: "", scope: securitySchemas[sec][scope]
                                            , url: new UrlPattern(customPath + "(*)")});
                                        this.PERMISSIONS.addPermission(
                                            { method: req.toUpperCase()
                                            , resource: "", scope: securitySchemas[sec][scope]
                                            , url: new UrlPattern(customPath, { })});
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private static protectAndCheckPermission(req: Request, res: Response, next: NextFunction, permission: Permissions) {
        this.keycloakProtect(req, res, () => {
            // TODO: verify scopes of token.
            // this.checkPermission(req, permission)
            // .then(() => {
                LoggerUtility.debug("Access success");
                next();
            // }).catch((error) => {
            //     LoggerUtility.error(`access denied: ${error}`);
            //     this.keycloak.accessDenied(req, res);
            // });
        });
    }

    private static checkPermission(req: Request, permission: Permissions) {
        const scopes = [ permission.scope ];
        LoggerUtility.debug(`Required scopes: , ${scopes}`);
        return this.getAccessToken(req)
            .then((accessToken) =>
            this.checkEntitlementRequest(permission.resource, scopes, accessToken));
    }

    private static getAccessToken(req: Request) {
        const tokens = req.headers.authorization;
        return tokens ? Promise.resolve(tokens) : Promise.reject("There is not token.");
    }

    private static checkEntitlementRequest(resource: string, scopes: Array<string> | string, accessToken) {
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
        return `${this.keyCloakConfig["auth-server-url"]}/authz/entitlement/${this.keyCloakConfig.resource}`;
    }
}

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

export class KeyCloakUtils {

    public static readonly PERMISSIONS = new KeyCloakPermissions([
    ]).notProtect(
        "/swagger(*)",
        "/docs(*)",
        "/api-docs"
    );

    public static async init(app: core.Express): Promise<void> {
        this.readSecuritySchemes();
        const keyCloakPath = path.join(__dirname, "../../../src/assets/keycloak.json");
        if (fs.existsSync(keyCloakPath)) {
            LoggerUtility.info("Keycloak: Configurating auth server...");
            this.keyCloakConfig = jsyaml.safeLoad(fs.readFileSync(keyCloakPath, "utf8"));
            this.getEnvInformation();
            this.entitlementUrl = this.createEntitlementUrl();
            await this.setPublicKeyCert();
            this.memoryStore = new session.MemoryStore();
            app.use(session({
                resave: false,
                saveUninitialized: true,
                secret: process.env.KEYCLOAK_PUBLIC_KEY,
                store: this.memoryStore
            }));
            this.keycloak = new Keycloak({ store: this.memoryStore }, this.keyCloakConfig);
            this.keycloak.redirectToLogin = () => false;
            this.keycloak.accessDenied = (req, res) => {
                ResponsePayload.response401(res);
                LoggerUtility.error(`Keycloak: Not authenticated access for: ${req.method} ${req.originalUrl}`);
            };
            const handler = this.keycloak.middleware();
            app.use(handler);
            app.use(this.createSecurityMiddleware());
            this.keycloakProtect = this.keycloak.protect();
        } else {
            LoggerUtility.warn("Keycloak: Cannot find keycloak configuration file.");
        }
        LoggerUtility.info("Keycloak: configuration finished!");
        return Promise.resolve();
    }

    public static getEnvInformation(): void {
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
            LoggerUtility.warn("NOT FOUND KEYCLOAK_PUBLIC_KEY variable");
        }
        if (process.env.KEYCLOAK_CLIENT_SECRET) {
            LoggerUtility.info(`Adding client secret...`);
            this.keyCloakConfig.credentials = {};
            this.keyCloakConfig.credentials.secret = process.env.KEYCLOAK_CLIENT_SECRET;
        } else {
            LoggerUtility.error("NOT FOUND KEYCLOAK_CLIENT_SECRET variable");
            process.exit(1);
        }
        if (process.env.KEYCLOAK_REALM) {
            LoggerUtility.info(`Adding realm... ${process.env.KEYCLOAK_REALM}`);
            this.keyCloakConfig.realm = process.env.KEYCLOAK_REALM;
        } else {
            LoggerUtility.warn(`USING DEFAULT KEYCLOAK REALM NAME: ${this.keyCloakConfig.realm}`);
        }
        if (process.env.KEYCLOAK_RESOURCE) {
            LoggerUtility.info(`Adding resource... ${process.env.KEYCLOAK_RESOURCE}`);
            this.keyCloakConfig.resource = process.env.KEYCLOAK_RESOURCE;
        } else {
            LoggerUtility.warn(`USING DEFAULT KEYCLOAK RESOURCE NAME: ${this.keyCloakConfig.resource}`);
        }
    }

    public static async setPublicKeyCert(): Promise<void> {
        const certs = await this.getCerts();
        if (certs) {
            const publicKey = certs.public_key;
            LoggerUtility.info(`Keycloak: found public key.`, publicKey);
            if (this.keyCloakConfig["realm-public-key"]) {
                if (publicKey === this.keyCloakConfig["realm-public-key"]) {
                    LoggerUtility.info(`Keycloak: provided key was equal to the one found in env`);
                } else {
                    LoggerUtility.warn(`Keycloak: provided key was not equal to the one found in env. Using the one obtained from the server`);
                    this.keyCloakConfig["realm-public-key"] = publicKey;
                }
            } else {
                LoggerUtility.info(`Keycloak: Using the public key obtained from the server.`);
                this.keyCloakConfig["realm-public-key"] = publicKey;
            }
        } else {
            LoggerUtility.error(`Keycloak: fail to retrieve public key.`);
            process.exit(1);
        }
        return Promise.resolve();
    }

    public static createSecurityMiddleware(): RequestHandler {
        return (req: Request, res: Response, next: NextFunction) => {
            if (this.PERMISSIONS.isNotProtectedUrl(req)) {
                return next();
            }
            const permission = this.PERMISSIONS.findPermission(req);
            if (!permission) {
                LoggerUtility.warn(`Keycloak: Can not find a permission for: ${req.method} ${req.originalUrl}`);
                return ResponsePayload.response401(res);
            }
            LoggerUtility.debug(`Keycloak: Found permissions: ${req.originalUrl}, ${permission.method}, ${permission.scope}`);
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
            this.checkPermission(req, res, permission)
            .then(() => {
                LoggerUtility.debug("Keycloak: Access success");
                next();
            }).catch((error) => {
                LoggerUtility.error(`Keycloak: access denied: ${error}`);
                this.keycloak.accessDenied(req, res);
            });
        });
    }

    private static async checkPermission(req: Request, res: Response, permission: Permissions) {
        // TODO: verify scopes of token.
        // const scopes = [ permission.scope ];
        // grant contains all user info included "scopes".
        // const grant = await this.keycloak.getGrant(req, res);
        // const rolesRealm = grant.access_token.content.realm_access.roles;
        // const rolesResource = grant.access_token.content.resource_access;
        // let scopesUser: any = grant.access_token.content;
        // scopesUser = scopesUser.scope;
        // LoggerUtility.debug(`Keycloak: Required scopes: , ${scopes}`);
        // LoggerUtility.debug(`Keycloak: Found Realm Roles: , ${rolesRealm}`);
        // LoggerUtility.debug(`Keycloak: Found Resource roles:`, rolesResource);
        // LoggerUtility.debug(`Keycloak: Found scopes: , ${scopesUser}`);
        return Promise.resolve();
    }

    private static getCerts() {
        const options = {
            headers: {
                Accept: "application/json"
            },
            json: true,
            method: "GET",
            url: this.entitlementUrl
        };
        return request(options);
    }

    private static createEntitlementUrl() {
        return `${this.keyCloakConfig["auth-server-url"]}/realms/${this.keyCloakConfig.realm}`;
        // return `${this.keyCloakConfig["auth-server-url"]}
        // /realms/${this.keyCloakConfig.realm}/protocol/openid-connect/certs`;
    }
}

"use strict";

import UrlPattern from "url-pattern";

export class KeyCloakPermissions {

    private publicUrls: Array<UrlPattern>;
    private permissions: Array<Permissions>;

    constructor(permissions) {
        this.publicUrls = [];
        this.permissions = [];
        permissions.forEach((permission) => {
            const url = new UrlPattern(permission[0]);
            const method = permission[1].toUpperCase();
            const resource = permission[2];
            const scope = permission[3];
            this.permissions.push({ url, method, resource, scope });
        });
    }

    public notProtect(...publicUrls: Array<string>) {
        publicUrls.forEach((url) => this.publicUrls.push(new UrlPattern(url)));
        return this;
    }

    public findPermission(request) {
        return this.permissions.find((permission) =>
            request.method.toUpperCase() === permission.method && permission.url.match(request.originalUrl)
        );
    }

    public isNotProtectedUrl(request) {
        const url = request.originalUrl;
        const result = this.publicUrls.find((u) => u.match(url));
        return result !== undefined;
    }

    public addPermission(newPermission: Permissions) {
        if (!this.permissions) {
            this.permissions = [];
        }
        this.permissions.push(newPermission);
    }

}

export interface Permissions {
    url: UrlPattern;
    method: string;
    resource: string;
    scope: string;
}

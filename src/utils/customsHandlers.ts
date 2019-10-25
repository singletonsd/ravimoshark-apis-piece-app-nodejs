import { NextFunction, Response } from "express";
import { Swagger12Request } from "swagger-tools";

export interface CustomNext extends NextFunction {
}

export interface CustomResponse extends Response {
}

export interface CustomRequest extends Swagger12Request {
    user: CustomUserInfo;
}

export interface CustomUserInfo {
}

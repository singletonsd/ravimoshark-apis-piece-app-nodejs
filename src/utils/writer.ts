import { CustomResponse } from "./customsHandlers";
import { VALID_RESPONSES } from "./ValidResponses";

export class ResponsePayload {

    public static response(response: CustomResponse, payload: any, code?: number) {
        if (!code) {
            // if no response code given, we default to 200
            code = 200;
        }
        if (!payload) {
            code = 204;
        } else if (typeof payload === "object") {
            payload = JSON.stringify(payload);
        } else {
            payload = JSON.stringify({ message: payload });
        }
        response.writeHead(code, { "Content-Type": "application/json" });
        response.end(payload);
    }

    public static response401(response: CustomResponse): void {
        ResponsePayload.response(response, VALID_RESPONSES.ERROR.AUTH.TOKEN.USER, 401);
    }

    public static response400(response: CustomResponse, payload: string): void {
        ResponsePayload.response(response, payload, 400);
    }

    private code: number;
    private payload: string;

    constructor(payload: string, code?: number) {
        this.code = code;
        this.payload = payload;
    }

    public response(response: CustomResponse) {
        ResponsePayload.response(response, this.payload, this.code);
    }
}

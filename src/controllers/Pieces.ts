"use strict";

import { PiecesService } from "../service";
import { CustomNext, CustomRequest, CustomResponse } from "../utils/customsHandlers";
import { ParametersComplete, ParametersIdDeleted, Utilities } from "../utils/utilities";
import { ResponsePayload } from "../utils/writer";

module.exports.getPieceById = (req: CustomRequest, res: CustomResponse, next: CustomNext) => {
  const params: ParametersIdDeleted = Utilities.checkIdAndDelete(req.swagger.params, res);
  if (!params) {
      return;
  }
  PiecesService.getById(params)
    .then((response: any) => {
      ResponsePayload.response(res, response);
    }).catch((response: any) => {
      ResponsePayload.response400(res, response);
    });
};

module.exports.getPieces = (req: CustomRequest, res: CustomResponse, next: CustomNext) => {
  const params: ParametersComplete = Utilities.checkAllParametersGet(req.swagger.params, res);
  if (!params) {
    return;
  }
  PiecesService.get(params)
    .then((response: any) => {
      ResponsePayload.response(res, response);
    }).catch((response: any) => {
      ResponsePayload.response400(res, response);
    });
};

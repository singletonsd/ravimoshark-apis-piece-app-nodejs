"use strict";

import { ProductsService } from "../service";
import { CustomNext, CustomRequest, CustomResponse } from "../utils/customsHandlers";
import { ParametersComplete, ParametersIdDeleted, Utilities } from "../utils/utilities";
import { ResponsePayload } from "../utils/writer";

module.exports.getProductById = (req: CustomRequest, res: CustomResponse, next: CustomNext) => {
  const params: ParametersIdDeleted = Utilities.checkIdAndDelete(req.swagger.params, res);
  if (!params) {
      return;
  }
  ProductsService.getById(params)
    .then((response: any) => {
      ResponsePayload.response(res, response);
    }).catch((response: any) => {
      ResponsePayload.response400(res, response);
    });
};

module.exports.getProducts = (req: CustomRequest, res: CustomResponse, next: CustomNext) => {
  const params: ParametersComplete = Utilities.checkAllParametersGet(req.swagger.params, res);
  if (!params) {
    return;
  }
  ProductsService.get(params)
    .then((response: any) => {
      ResponsePayload.response(res, response);
    }).catch((response: any) => {
      ResponsePayload.response400(res, response);
    });
};

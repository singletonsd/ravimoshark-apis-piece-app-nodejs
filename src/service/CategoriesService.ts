"use strict";

import { Metadata } from "../models";
import { LoggerUtility } from "../utils/LoggerUtility";
import { ParametersComplete, ParametersIdDeleted, Utilities } from "../utils/utilities";
import { VALID_RESPONSES } from "../utils/ValidResponses";

const SERVICE_NAME = "CategoriesService";
export class CategoriesService {

  /**
   * Get all categories.
   * Get all categories.
   *
   * skip Integer number of item to skip (optional)
   * limit Integer max records to return (optional)
   * orderBy String order by property. (optional)
   * filterBy String filter data. (optional)
   * deleted Deleted Get all, deleted, not deleted data. Default not deleted. (optional)
   * metadata Boolean If metadata is needed (for pagination controls) (optional)
   * category Categories category of desired product. (optional)
   * returns inline_response_200
   */
  public static get(params: ParametersComplete) {
    return new Promise((resolve, reject) => {
      const examples = {};
      if (Object.keys(examples).length > 0) {
        resolve(examples[Object.keys(examples)[0]]);
      } else {
        resolve();
      }
    });
  }

}

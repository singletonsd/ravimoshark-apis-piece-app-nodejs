"use strict";

import { getConnection } from "typeorm";
import { Pieces } from "../databases/entities";
import { DatabaseUtilities } from "../databases/utils/DatabaseUtils";
import { Metadata } from "../models";
import { LoggerUtility } from "../utils/LoggerUtility";
import { ParametersComplete, ParametersIdDeleted, Utilities } from "../utils/utilities";
import { VALID_RESPONSES } from "../utils/ValidResponses";

const SERVICE_NAME = "PiecesService";
export class PiecesService {

  /**
   * Get one piece.
   * Get one piece.
   *
   * refArticle Long reference of piece to delete or search
   * deleted Deleted Get all, deleted, not deleted data. Default not deleted. (optional)
   * returns Pieces
   */
  public static getById(params: ParametersIdDeleted): Promise<Pieces> {
    const FUNCTION_NAME = "getById";
    const logHeader = `${SERVICE_NAME}: ${FUNCTION_NAME} -`;
    return new Promise<Pieces>(async (resolve, reject) => {
      LoggerUtility.info(`${logHeader}`);
      LoggerUtility.debug(`${logHeader} with`, params);
      const previous: Pieces = await getConnection().manager.findOne(Pieces,
          DatabaseUtilities.getFindOneObject(params.id, params.deleted, Pieces));
      if (!previous) {
        LoggerUtility.warn(`${logHeader} not exists with id=${params.id} and deleted=${params.deleted.toString()}`);
        reject(VALID_RESPONSES.ERROR.NOT_EXIST.PIECE);
        return;
      }
      LoggerUtility.info(`${logHeader} got ${previous.refArticle}`);
      resolve(previous);
      return;
    });
  }

  /**
   * Get all pieces.
   * Get all pieces.
   *
   * skip Integer number of item to skip (optional)
   * limit Integer max records to return (optional)
   * orderBy String order by property. (optional)
   * filterBy String filter data. (optional)
   * deleted Deleted Get all, deleted, not deleted data. Default not deleted. (optional)
   * metadata Boolean If metadata is needed (for pagination controls) (optional)
   * category Categories category of desired product. (optional)
   * returns inline_response_200_1
   */
  public static get(params: ParametersComplete): Promise<{metadata: Metadata, items: Array<Pieces>}> {
    const FUNCTION_NAME = "get";
    const logHeader = `${SERVICE_NAME}: ${FUNCTION_NAME} -`;
    return new Promise<{metadata: Metadata, items: Array<Pieces>}>(async (resolve, reject) => {
    LoggerUtility.info(`${logHeader}`);
    const object = DatabaseUtilities.getFindObject(params, Pieces);
    if (!object) {
      LoggerUtility.warn(`${logHeader} order param malformed ${params.orderBy}`);
      reject(VALID_RESPONSES.ERROR.PARAMS.MALFORMED.ORDERBY);
      return;
    }
    LoggerUtility.debug(`${logHeader} with`, object);
    const [items, total] = await getConnection().manager.findAndCount(Pieces, object);
    if (!items || !items.length) {
      LoggerUtility.warn(`${logHeader} empty result`);
      resolve();
      return;
    }
    LoggerUtility.info(`${logHeader} got ${items.length}`);
    resolve(Utilities.getMetadataFormat(items, total, params));
    return;
    });
  }

}

import { BaseEntity, FindManyOptions, FindOneOptions, ObjectType } from "typeorm";
import { Deleted } from "../../models";
import { LoggerUtility } from "../../utils/LoggerUtility";
import { ParametersComplete } from "../../utils/utilities";
import { PieceCards, Pieces } from "../entities";

export class DatabaseUtilities {
  public static getFindOneObject(id: number | string, deleted: Deleted, entity: ObjectType<BaseEntity>
                              ,  relations?: Array<string>): FindOneOptions {
    const whereObject: { id?: number | string, refArticle?: number | string } = { };
    if (entity === Pieces) {
      whereObject.refArticle = id;
    } else {
      whereObject.id = id;
    }
    const object: FindOneOptions<typeof entity> = {
      where: this.addDeletedParam(deleted, whereObject)
    };
    object.relations = this.addRelations(entity, relations);
    return object;
  }

  public static getFindObject(
    params: ParametersComplete, entity: ObjectType<BaseEntity>,
    relations?: Array<string>, selections?: Array<string>): FindManyOptions {
    let whereObject: { idUser?: number } = {};
    if (params.filterBy) {
      try {
        whereObject = JSON.parse(params.filterBy);
      } catch (e) {
        LoggerUtility.warn("orderBy parameter provided is not in JSON format.", params.orderBy);
      }
    }
    const object: FindManyOptions<typeof entity> = {
      skip: params.skip,
      take: params.limit,
      where: this.addDeletedParam(params.deleted, whereObject)
    };
    if (params.refArticle) {
      this.addParam("client", params.refArticle.toLocaleUpperCase(), object.where);
    }
    if (params.orderBy) {
      let order: object;
      try {
        order = JSON.parse(params.orderBy);
      } catch (e) {
        order = { id: params.orderBy };
      }
      if (order) {
        object.order = order;
      } else {
        return null;
      }
    }
    object.relations = this.addRelations(entity, relations);
    // object.select = this.addSelections(entity, selections);
    return object;
  }

  public static addDeletedParam(deleted: Deleted, params: any): object {
    if (!params) {
      params = {};
    }
    switch (deleted) {
      case Deleted.ALL:
        break;
      case Deleted.DELETED:
        params.deleted = true;
        break;
      case Deleted.ACTIVE:
        params.deleted = false;
        break;
    }
    return params;
  }

  public static addParam(parameter: string, value: string, params: any): object {
    if (!params) {
      params = {};
    }
    if (value) {
      params[parameter] = value;
    }
    return params;
  }

  public static addRelations(entity: ObjectType<BaseEntity>, relations?: Array<string>): Array<string> {
    let finalRelations: Array<string>;
    if (relations) {
      finalRelations = relations;
    } else if (entity === Pieces) {
      finalRelations = [];
    } else if (entity === PieceCards) {
      finalRelations = [ "piece", "pieceKeyPoints", "pieceDetails", "category" ];
    }
    return finalRelations;
  }

}

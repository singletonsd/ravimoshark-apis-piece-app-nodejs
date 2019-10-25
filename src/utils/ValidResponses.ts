// TODO: improve format to apply a translation.
export const VALID_RESPONSES = {
    ERROR: {
        AUTH: {
            TOKEN: {
                APP: "error.auth.token.app",
                USER: "error.auth.token.user"
            },
            UNPRIVILEGED: "error.auth.unprivileged"
        },
        EXIST: {
            CATEGORY: "error.exist.category",
            PIECE: "error.exist.piece",
            PRODUCT: "error.exist.product"
        },
        NOT_DELETED: "error.not_deleted",
        NOT_EXIST: {
            CATEGORY: "error.not_exist.category",
            PIECE: "error.not_exist.piece",
            PRODUCT: "error.not_exist.product"
        },
        PARAMS: {
            MALFORMED: {
                ORDERBY: "error.params.malformed.orderby"
            },
            MISSING: "error.params.missing"
        },
        UNRECOGNIZED: "error.unrecognized",
        VALIDATION: {
            ID: "error.validation.id",
            NAME: "error.validation.name",
            URL: "error.validation.url"
        }
    }
};

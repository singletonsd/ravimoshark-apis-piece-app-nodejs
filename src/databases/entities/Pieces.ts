import { Column, Entity, Index, OneToMany } from "typeorm";
import { PieceCards } from "./PieceCards";
import { PieceDetails } from "./PieceDetails";
import { PiecesKeyPoints } from "./PieceKeyPoints";

@Entity("Pieces")
@Index("UQ_Pieces_RefArticle", ["refArticle"], { unique: true })
export class Pieces {
    @Column("nvarchar", {
        length: 100,
        name: "RefArticle",
        nullable: false,
        primary: true
    })
    public refArticle?: string;

    @Column("nvarchar", {
        length: 100,
        name: "DesignationArticle",
        nullable: true
    })
    public name?: string | null;

    @Column("nvarchar", {
        length: 100,
        name: "Statut",
        nullable: true
    })
    public state?: string | null;

    @Column("float", {
        name: "PrixVente",
        nullable: true,
        precision: 53
    })
    public priceSale?: number | null;

    @Column("float", {
        name: "UniteVente",
        nullable: true,
        precision: 53
    })
    public uniteVente?: number | null;

    @Column("nvarchar", {
        length: 100,
        name: "IntituleFamille",
        nullable: true
    })
    public saleUnit?: string | null;

    @Column("float", {
        name: "DernierPrixAchat",
        nullable: true,
        precision: 53
    })
    public priceLastPurchase?: number | null;

    @Column("nvarchar", {
        length: 100,
        name: "Conditionnement",
        nullable: true
    })
    public packaging?: string | null;

    @Column("nvarchar", {
        length: 100,
        name: "DetergentType",
        nullable: true
    })
    public detergentType?: string | null;

    @Column("float", {
        name: "Poids",
        nullable: true,
        precision: 53
    })
    public weight?: number | null;

    @Column("float", {
        name: "PoidSuc",
        nullable: true,
        precision: 53,
        select: false
    })
    public poidSuc?: number | null;

    @OneToMany(() => PieceCards, (pieceCards: PieceCards) => pieceCards.piece)
    public pieceCards?: Array<PieceCards>;

    @OneToMany(() => PieceDetails, (pieceDetail: PieceDetails) => pieceDetail.piece)
    public pieceDetails?: Array<PieceDetails>;

    @OneToMany(() => PiecesKeyPoints, (pieceKeyPoint: PiecesKeyPoints) => pieceKeyPoint.piece)
    public pieceKeyPoints?: Array<PiecesKeyPoints>;

    @Column("datetimeoffset", {
        default: () => "sysdatetimeoffset()",
        name: "__createdAt",
        nullable: false
    })
    public createdAt?: Date;

    @Column("datetimeoffset", {
        default: () => "sysdatetimeoffset()",
        name: "__updatedAt",
        nullable: false
    })
    public updatedAt?: Date;

    @Column("bit", {
        default: () => "(0)",
        name: "__deleted",
        nullable: false
    })
    public deleted?: boolean;

    public constructor(init?: Partial<Pieces>) {
      Object.assign(this, init);
    }
}

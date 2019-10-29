import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { PieceCategories } from "./PieceCategories";
import { PieceDetails } from "./PieceDetails";
import { PiecesKeyPoints } from "./PieceKeyPoints";
import { Pieces } from "./Pieces";

@Entity("PiecesFiche")
export class PieceCards {

    @PrimaryGeneratedColumn({
        name: "id",
        type: "int"
    })
    public id?: number;

    @Column("nvarchar", {
        length: 1500,
        name: "Description",
        nullable: false
    })
    public description?: string;

    @ManyToOne(() => PieceCategories, (pieceCategory: PieceCategories) => pieceCategory.pieceCards, { nullable: false })
    @JoinColumn({ name: "Category" })
    public category?: PieceCategories;

    @RelationId((pieceCard: PieceCards) => pieceCard.category)
    public categoryId?: string;

    @Column("nvarchar", {
        length: 100,
        name: "Imagename",
        nullable: true
    })
    public imageName?: string | null;

    @ManyToOne(() => Pieces, (pieces: Pieces) => pieces.pieceCards, { nullable: false })
    @JoinColumn({ name: "RefArticle" })
    public piece?: Pieces | null;

    @RelationId((piecesFiche: PieceCards) => piecesFiche.piece)
    public refArticleId?: Promise<Array<string>>;

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

    public constructor(init?: Partial<PieceCards>) {
        Object.assign(this, init);
    }
}

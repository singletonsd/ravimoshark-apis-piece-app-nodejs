import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Pieces } from "./Pieces";

@Entity("PiecesKeyPoints")
export class PiecesKeyPoints {

    @ManyToOne(() => Pieces, (pieces: Pieces) => pieces.pieceKeyPoints, { nullable: false })
    @JoinColumn({ name: "RefArticle" })
    public piece?: Pieces | null;

    @RelationId((piecesKeyPoints: PiecesKeyPoints) => piecesKeyPoints.piece)
    public refArticleId?: string;

    @PrimaryGeneratedColumn({
        name: "id",
        type: "int"
    })
    public id?: number;

    @Column("int", {
        name: "Ligne",
        nullable: false
    })
    public line?: number;

    @Column("nvarchar", {
        length: 400,
        name: "Content",
        nullable: false
    })
    public content?: string;

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

    public constructor(init?: Partial<PiecesKeyPoints>) {
        Object.assign(this, init);
    }
}

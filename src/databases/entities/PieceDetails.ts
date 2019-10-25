import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId} from "typeorm";
import {Pieces} from "./Pieces";

@Entity("PiecesDetail")
export class PieceDetails {

    @ManyToOne(() => Pieces, (pieces: Pieces) => pieces.pieceDetails, {  nullable: false })
    @JoinColumn({ name: "RefArticle"})
    public piece?: Pieces | null;

    @RelationId((piecesDetail: PieceDetails) => piecesDetail.piece)
    public refArticleId?: string;

    @PrimaryGeneratedColumn({
        name: "id",
        type: "int"
        })
    public id?: number;

    @Column("nvarchar", {
        length: 100,
        name: "Title",
        nullable: false
        })
    public title?: string;

    @Column("nvarchar", {
        length: 100,
        name: "Content",
        nullable: false
        })
    public content?: string;

    @Column("int", {
        name: "Ligne",
        nullable: false
        })
    public line?: number;

    @Column("nvarchar", {
        length: 100,
        name: "Unit",
        nullable: false
        })
    public unit?: string;

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

    public constructor(init?: Partial<PieceDetails>) {
        Object.assign(this, init);
    }

}

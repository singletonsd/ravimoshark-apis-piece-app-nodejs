import { Column, Entity, OneToMany } from "typeorm";
import { PieceCards } from "./PieceCards";

@Entity("PiecesCategory")
export class PieceCategories {

    @Column("nvarchar", {
        length: 100,
        name: "Category",
        nullable: false,
        primary: true
    })
    public name?: string;

    @Column("nvarchar", {
        length: 100,
        name: "Imagename",
        nullable: false
    })
    public imageName?: string;

    @Column("nvarchar", {
        length: 100,
        name: "Imageextension",
        nullable: false
    })
    public imageExtension?: string;

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

    @OneToMany(() => PieceCards, (piecesCard: PieceCards) => piecesCard.category)
    public pieceCards?: Array<PieceCards>;

    public constructor(init?: Partial<PieceCategories>) {
        Object.assign(this, init);
    }
}

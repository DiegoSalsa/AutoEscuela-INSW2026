import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Vehicle {
    @PrimaryGeneratedColumn()
    id;

    @Column()
    modelo; // requisito: modelo

    @Column({ unique: true })
    patente; // requisito: patente

    @Column()
    sede; // requisito: Sede asignada

    @Column({
        type: "enum",
        enum: ["Disponible", "En sesion", "Mantenimiento"],
        default: "Disponible"
    })
    estado; // requisito: estado en tiempo real

    @Column("int", { default: 0 })
    kilometraje_actual; // para el motor de alertas

    @Column("date", { nullable: true })
    fecha_revision_tecnica; // para alerta de revision tecnica 
}
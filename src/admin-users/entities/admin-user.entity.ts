import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AdminRole {
    ADMIN = 'admin',
    MERCHANT = 'merchant',
}

@Entity('admin_users')
export class AdminUser {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password: string;

    @Column({ type: 'varchar', length: 20 })
    phone: string;

    @Column({ type: 'enum', enum: AdminRole, default: AdminRole.MERCHANT })
    role: AdminRole;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

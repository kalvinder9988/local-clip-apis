import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Zipcode } from '../../zipcodes/entities/zipcode.entity';

@Entity('zipcode_groups')
export class ZipcodeGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'boolean', default: true })
    status: boolean;

    @Column({ type: 'boolean', default: false })
    deleted: boolean;

    @OneToMany(() => Zipcode, (zipcode) => zipcode.group, { cascade: true, eager: false })
    zipcodes: Zipcode[];

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ZipcodeGroup } from '../../zipcode-groups/entities/zipcode-group.entity';

@Entity('zipcodes')
export class Zipcode {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 10 })
    zipcode: string;

    @Column({ type: 'varchar', length: 255 })
    location: string;

    @Column({ type: 'boolean', default: true })
    status: boolean;

    @Column({ type: 'boolean', default: false })
    deleted: boolean;

    @Column({ type: 'int', nullable: true })
    zipcode_group_id: number | null;

    @ManyToOne(() => ZipcodeGroup, (group) => group.zipcodes, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'zipcode_group_id' })
    group: ZipcodeGroup;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}

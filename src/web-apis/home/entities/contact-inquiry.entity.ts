import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

export enum ContactInquiryStatus {
    PENDING = 'pending',
    REJECTED = 'rejected',
    RESOLVED = 'resolved',
}

@Entity('contact_inquiries')
export class ContactInquiry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 20 })
    phone: string;

    @Column({ type: 'varchar', length: 255 })
    subject: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'int', nullable: true })
    user_id: number | null;

    @Column({
        type: 'enum',
        enum: ContactInquiryStatus,
        default: ContactInquiryStatus.PENDING,
    })
    status: ContactInquiryStatus;

    @CreateDateColumn()
    created_at: Date;
}

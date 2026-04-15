import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { MerchantBusiness } from './merchant-business.entity';
import { User } from '../../users/entities/user.entity';

export enum QuestionStatus {
    PENDING = 'pending',
    ANSWERED = 'answered',
}

@Entity('merchant_questions')
export class MerchantQuestion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    merchant_business_id: number;

    @Column({ nullable: true })
    user_id: number;

    @ManyToOne(() => MerchantBusiness, (business) => business.reviews, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'merchant_business_id' })
    merchant_business: MerchantBusiness;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'text' })
    question: string;

    @Column({ type: 'text', nullable: true })
    answer: string | null;

    @Column({
        type: 'enum',
        enum: QuestionStatus,
        default: QuestionStatus.PENDING,
    })
    status: QuestionStatus;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}

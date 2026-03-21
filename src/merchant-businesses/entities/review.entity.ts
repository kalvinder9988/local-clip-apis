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

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    merchant_business_id: number;

    @Column({ nullable: true })
    user_id: number;

    @ManyToOne(() => MerchantBusiness, (business) => business.reviews)
    @JoinColumn({ name: 'merchant_business_id' })
    merchant_business: MerchantBusiness;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'tinyint', unsigned: true, default: 0 })
    rating: number;

    @Column({ type: 'text' })
    review: string;

    @Column({ type: 'boolean', default: false })
    published: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}

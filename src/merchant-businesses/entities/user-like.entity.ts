import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MerchantBusiness } from './merchant-business.entity';

@Entity('user_likes')
@Unique(['user_id', 'merchant_business_id'])
export class UserLike {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    merchant_business_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => MerchantBusiness, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'merchant_business_id' })
    merchant_business: MerchantBusiness;

    @CreateDateColumn()
    created_at: Date;
}

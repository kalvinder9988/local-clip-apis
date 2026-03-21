import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MerchantBusiness } from './merchant-business.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';

@Entity('user_coupon_history')
export class UserCouponHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    merchant_business_id: number;

    @Column()
    coupon_id: number;

    @Column({ type: 'varchar', length: 100 })
    coupon_code: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => MerchantBusiness, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'merchant_business_id' })
    merchant_business: MerchantBusiness;

    @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coupon_id' })
    coupon: Coupon;

    @CreateDateColumn()
    created_at: Date;
}

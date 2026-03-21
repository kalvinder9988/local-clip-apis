import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MerchantBusiness } from './merchant-business.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';

export type SharedCouponRecipient = 'me' | 'other';

@Entity('shared_coupons')
export class SharedCoupon {
    @PrimaryGeneratedColumn()
    id: number;

    /** The logged-in user who shared */
    @Column()
    shared_by_user_id: number;

    @Column()
    coupon_id: number;

    @Column()
    merchant_business_id: number;

    @Column({ type: 'varchar', length: 100 })
    coupon_code: string;

    /** 'me' → shared to self | 'other' → shared to someone else */
    @Column({ type: 'enum', enum: ['me', 'other'] })
    recipient_type: SharedCouponRecipient;

    /** Name of recipient (null for 'me') */
    @Column({ type: 'varchar', length: 150, nullable: true })
    recipient_name: string | null;

    @Column({ type: 'varchar', length: 200 })
    recipient_email: string;

    /** Phone of recipient (null for 'me') */
    @Column({ type: 'varchar', length: 30, nullable: true })
    recipient_phone: string | null;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'shared_by_user_id' })
    shared_by: User;

    @ManyToOne(() => MerchantBusiness, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'merchant_business_id' })
    merchant_business: MerchantBusiness;

    @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coupon_id' })
    coupon: Coupon;

    @CreateDateColumn()
    created_at: Date;
}

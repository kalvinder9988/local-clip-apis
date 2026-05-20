import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';

export enum CouponReactionType {
    LIKE = 'like',
    DISLIKE = 'dislike',
}

@Entity('user_coupon_reactions')
@Unique(['user_id', 'coupon_id'])
export class UserCouponReaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    coupon_id: number;

    @Column({ type: 'enum', enum: CouponReactionType })
    reaction_type: CouponReactionType;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coupon_id' })
    coupon: Coupon;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

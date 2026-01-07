import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    AfterLoad,
} from 'typeorm';
import { MerchantBusiness } from '../../merchant-businesses/entities/merchant-business.entity';

@Entity('coupons')
export class Coupon {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => MerchantBusiness, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'merchant_business_id' })
    merchant_business: MerchantBusiness;

    @Column({ type: 'int' })
    merchant_business_id: number;

    @Column({ type: 'varchar', length: 255 })
    coupon_name: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    coupon_code: string;

    @Column({ type: 'enum', enum: ['flat', 'percentage'] })
    type: 'flat' | 'percentage';

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    coupon_value: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    coupon_image: string;

    // Virtual property for coupon image URL
    coupon_image_url?: string;

    @AfterLoad()
    setCouponImageUrl() {
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:9001';
        if (this.coupon_image) {
            // If path already has 'uploads/', keep it, otherwise add it
            const hasUploads = this.coupon_image.startsWith('uploads/');
            this.coupon_image_url = hasUploads
                ? `${baseUrl}/${this.coupon_image}`
                : `${baseUrl}/uploads/${this.coupon_image}`;
        }
    }

    @Column({ type: 'int', default: 0 })
    total_likes: number;

    @Column({ type: 'int', default: 0 })
    total_dislikes: number;

    @Column({ type: 'int', default: 0 })
    total_shared: number;

    @Column({ type: 'date' })
    valid_from: Date;

    @Column({ type: 'date' })
    valid_to: Date;

    @Column({ type: 'boolean', default: true })
    status: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}

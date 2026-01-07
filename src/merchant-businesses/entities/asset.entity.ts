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
import { MerchantBusiness } from './merchant-business.entity';

@Entity('assets')
export class Asset {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => MerchantBusiness, (business) => business.assets)
    @JoinColumn({ name: 'merchant_business_id' })
    merchant_business: MerchantBusiness;

    @Column({ type: 'varchar', length: 500 })
    asset_name: string;

    // Virtual property for asset URL
    asset_url?: string;

    @AfterLoad()
    setAssetUrl() {
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:9001';
        if (this.asset_name) {
            // If path already has 'uploads/', keep it, otherwise add it
            const hasUploads = this.asset_name.startsWith('uploads/');
            this.asset_url = hasUploads
                ? `${baseUrl}/${this.asset_name}`
                : `${baseUrl}/uploads/${this.asset_name}`;
        }
    }

    @Column({
        type: 'enum',
        enum: ['image', 'video', 'attachment'],
        default: 'image'
    })
    asset_type: 'image' | 'video' | 'attachment';

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}

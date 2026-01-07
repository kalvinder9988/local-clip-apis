import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    AfterLoad,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Zipcode } from '../../zipcodes/entities/zipcode.entity';
import { AdminUser } from '../../admin-users/entities/admin-user.entity';
import { MerchantConvenience } from './merchant-convenience.entity';
import { Asset } from './asset.entity';
import { Review } from './review.entity';

@Entity('merchant_businesses')
export class MerchantBusiness {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    business_name: string;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
    slug: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    business_tagline: string;

    @Column({ type: 'varchar', length: 20 })
    phone: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    website: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    banner_image: string;

    // Virtual property for banner image URL
    banner_image_url?: string;

    @AfterLoad()
    setBannerImageUrl() {
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:9001';
        if (this.banner_image) {
            // If path already has 'uploads/', keep it, otherwise add it
            const hasUploads = this.banner_image.startsWith('uploads/');
            this.banner_image_url = hasUploads
                ? `${baseUrl}/${this.banner_image}`
                : `${baseUrl}/uploads/${this.banner_image}`;
        }
    }

    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToOne(() => Zipcode)
    @JoinColumn({ name: 'zipcode_id' })
    zipcode: Zipcode;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @ManyToOne(() => AdminUser)
    @JoinColumn({ name: 'merchant_id' })
    merchant: AdminUser;

    @Column({ type: 'varchar', length: 255 })
    location: string;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    lat: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    lng: number;

    @Column({ type: 'boolean', default: false })
    featured_savings: boolean;

    @Column({ type: 'boolean', default: false })
    more_great_savings: boolean;

    @Column({ type: 'boolean', default: true })
    status: boolean;

    @Column({ type: 'boolean', default: false })
    deleted: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    // Relations
    @OneToMany(() => MerchantConvenience, (convenience) => convenience.merchant_business)
    merchant_convenience: MerchantConvenience[];

    @OneToMany(() => Asset, (asset) => asset.merchant_business)
    assets: Asset[];

    @OneToMany(() => Review, (review) => review.merchant_business)
    reviews: Review[];
}

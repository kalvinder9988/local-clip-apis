import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    AfterLoad,
} from 'typeorm';

@Entity('banners')
export class Banner {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500 })
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

    @Column({ type: 'varchar', length: 500, nullable: true })
    caption: string | null;

    @Column({ type: 'int', default: 0 })
    display_order: number;

    @Column({ type: 'boolean', default: true })
    status: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

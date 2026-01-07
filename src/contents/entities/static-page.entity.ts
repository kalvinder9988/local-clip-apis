import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum StaticPageType {
    TERMS_CONDITIONS = 'terms-conditions',
    PRIVACY_POLICY = 'privacy-policy',
    ABOUT_US = 'about-us',
}

@Entity('static_pages')
export class StaticPage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
    slug: string;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: StaticPageType,
        unique: true,
    })
    type: StaticPageType;

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status: string; // 'active' or 'inactive'

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

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
import { Convenience } from './convenience.entity';

@Entity('merchant_conveniences')
export class MerchantConvenience {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Convenience, (convenience) => convenience.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'convenience_id' })
    convenience: Convenience;

    @ManyToOne(() => MerchantBusiness, (business) => business.merchant_convenience, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'merchant_business_id' })
    merchant_business: MerchantBusiness;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}

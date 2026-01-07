import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMerchantBusinessDto } from './create-merchant-business.dto';
import { IsNumber, IsOptional } from 'class-validator';

// Omit owner fields from update DTO (owner cannot be changed after creation)
export class UpdateMerchantBusinessDto extends PartialType(
    OmitType(CreateMerchantBusinessDto, ['owner_name', 'owner_email', 'owner_phone', 'convenience_ids'] as const)
) {
    @IsNumber()
    @IsOptional()
    zipcode_id?: number;

    @IsNumber()
    @IsOptional()
    category_id?: number;
}

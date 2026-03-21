import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMerchantBusinessDto } from './create-merchant-business.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateMerchantBusinessDto extends PartialType(
    OmitType(CreateMerchantBusinessDto, ['owner_name', 'owner_email', 'owner_phone', 'convenience_ids'] as const)
) {
    @IsString()
    @IsOptional()
    owner_name?: string;

    @IsNumber()
    @IsOptional()
    zipcode_id?: number;

    @IsNumber()
    @IsOptional()
    category_id?: number;
}

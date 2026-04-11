import { PartialType } from '@nestjs/swagger';
import { CreateZipcodeGroupDto } from './create-zipcode-group.dto';

export class UpdateZipcodeGroupDto extends PartialType(CreateZipcodeGroupDto) { }

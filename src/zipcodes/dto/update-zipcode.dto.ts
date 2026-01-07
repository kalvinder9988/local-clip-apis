import { PartialType } from '@nestjs/swagger';
import { CreateZipcodeDto } from './create-zipcode.dto';

export class UpdateZipcodeDto extends PartialType(CreateZipcodeDto) {}

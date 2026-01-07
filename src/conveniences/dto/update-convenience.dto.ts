import { PartialType } from '@nestjs/swagger';
import { CreateConvenienceDto } from './create-convenience.dto';

export class UpdateConvenienceDto extends PartialType(CreateConvenienceDto) {}

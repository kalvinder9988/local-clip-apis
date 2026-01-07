import { Test, TestingModule } from '@nestjs/testing';
import { MerchantBusinessesService } from './merchant-businesses.service';

describe('MerchantBusinessesService', () => {
  let service: MerchantBusinessesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MerchantBusinessesService],
    }).compile();

    service = module.get<MerchantBusinessesService>(MerchantBusinessesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

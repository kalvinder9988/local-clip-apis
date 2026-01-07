import { Test, TestingModule } from '@nestjs/testing';
import { MerchantBusinessesController } from './merchant-businesses.controller';
import { MerchantBusinessesService } from './merchant-businesses.service';

describe('MerchantBusinessesController', () => {
  let controller: MerchantBusinessesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantBusinessesController],
      providers: [MerchantBusinessesService],
    }).compile();

    controller = module.get<MerchantBusinessesController>(MerchantBusinessesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

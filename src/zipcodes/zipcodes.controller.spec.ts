import { Test, TestingModule } from '@nestjs/testing';
import { ZipcodesController } from './zipcodes.controller';
import { ZipcodesService } from './zipcodes.service';

describe('ZipcodesController', () => {
  let controller: ZipcodesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZipcodesController],
      providers: [ZipcodesService],
    }).compile();

    controller = module.get<ZipcodesController>(ZipcodesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

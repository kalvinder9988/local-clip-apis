import { Test, TestingModule } from '@nestjs/testing';
import { ZipcodesService } from './zipcodes.service';

describe('ZipcodesService', () => {
  let service: ZipcodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZipcodesService],
    }).compile();

    service = module.get<ZipcodesService>(ZipcodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

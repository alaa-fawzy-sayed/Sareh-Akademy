import { Controller } from '@nestjs/common';
import { CollegesService } from './colleges.service';

@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}
}

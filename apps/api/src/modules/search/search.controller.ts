import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Global search across subjects, universities, colleges, teachers, and content' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') q: string,
    @Query('type') type?: 'all' | 'subjects' | 'universities' | 'colleges' | 'teachers' | 'content',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.searchService.search({
      q,
      type,
      page: pageNum,
      limit: limitNum,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Icd11CauseType } from './entities/icd11-cause-type.entity.js';
import { ListIcd11CausesQueryDto } from './dto/list-icd11-causes-query.dto.js';

@Injectable()
export class Icd11CausesService {
  constructor(
    @InjectRepository(Icd11CauseType)
    private readonly causeTypeRepository: Repository<Icd11CauseType>,
  ) {}

  async findAll(query: ListIcd11CausesQueryDto) {
    const {
      caseType,
      search,
      page = 1,
      limit = 20,
    } = query;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const queryBuilder = this.causeTypeRepository
      .createQueryBuilder('causeType')
      .innerJoinAndSelect('causeType.cause', 'cause')
      .where('causeType.caseType = :caseType', { caseType });

    if (search?.trim()) {
      queryBuilder.andWhere(
        '(cause.code LIKE :search OR cause.description LIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    queryBuilder
      .orderBy('cause.code', 'ASC')
      .addOrderBy('cause.description', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [causeTypes, total] = await queryBuilder.getManyAndCount();

    return {
      data: causeTypes.map((causeType) => causeType.cause),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}

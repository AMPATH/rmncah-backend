import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ContributingFactor } from './entities/contributing-factor.entity.js';
import { ListContributingFactorsQueryDto } from './dto/list-contributing-factors-query.dto.js';

@Injectable()
export class ContributingFactorsService {
  constructor(
    @InjectRepository(ContributingFactor)
    private readonly contributingFactorRepository: Repository<ContributingFactor>,
  ) {}

  async findAll(query: ListContributingFactorsQueryDto) {
    const queryBuilder = this.contributingFactorRepository
      .createQueryBuilder('factor')
      .where('factor.isActive = :isActive', { isActive: true });

    if (query.delayLevel) {
      queryBuilder.andWhere('factor.delayLevel = :delayLevel', {
        delayLevel: query.delayLevel,
      });
    }

    const data = await queryBuilder
      .orderBy('factor.delayLevel', 'ASC')
      .addOrderBy('factor.code', 'ASC')
      .getMany();

    return {
      data,
      total: data.length,
    };
  }
}

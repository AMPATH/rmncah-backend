
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  In,
  IsNull,
  Repository,
} from 'typeorm';

import { Progress } from './entities/progress.entity.js';
import { SectionProgress } from './entities/section-progress.entity.js';
import { LearningMaterialProgress } from './entities/learning-material-progress.entity.js';

import { CohortModuleAssignment } from '../cohorts/cohort-module-assignments/entities/cohort-module-assignment.entity.js';
import { CohortMentee } from '../cohorts/entities/cohort-mentee.entity.js';
import { CohortMembershipStatus } from '../cohorts/enum/cohorts.enum.js';

import { ModuleSection } from '../modules/module-sections/entities/module-section.entity.js';
import { LearningMaterial } from '../modules/learning-materials/entities/learning-material.entity.js';

import { UserOrganizationAssignment } from '../../shared/user-organization-assignments/entities/user-organization-assignment.entity.js';

import {
  AccountStatus,
  OrganizationLevel,
} from '../../shared/users/enum/users.enum.js';

import { ProgressStatus } from './enums/progress-status.enum.js';
import { SectionProgressStatus } from './enums/section-progress-status.enum.js';
import { LearningMaterialProgressStatus } from './enums/learning-progress-status.enum.js';

@Injectable()
export class ProgressService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,

    @InjectRepository(SectionProgress)
    private readonly sectionProgressRepository: Repository<SectionProgress>,

    @InjectRepository(LearningMaterialProgress)
    private readonly materialProgressRepository: Repository<LearningMaterialProgress>,
  ) {}

  
    // Initialize progress for all active mentees
    // when a module is assigned to a cohort.
   
  async initializeAssignmentProgress(assignmentId: string) {
    return this.dataSource.transaction(async (manager) => {
      const assignmentRepository = manager.getRepository(
        CohortModuleAssignment,
      );

      const menteeRepository = manager.getRepository(CohortMentee);
      const sectionRepository = manager.getRepository(ModuleSection);
      const materialRepository = manager.getRepository(LearningMaterial);

      const progressRepository = manager.getRepository(Progress);
      const sectionProgressRepository =
        manager.getRepository(SectionProgress);
      const materialProgressRepository =
        manager.getRepository(LearningMaterialProgress);

      const assignment = await assignmentRepository.findOne({
        where: { id: assignmentId },
      });

      if (!assignment) {
        throw new NotFoundException(
          'Cohort module assignment not found.',
        );
      }

      const memberships = await menteeRepository
        .createQueryBuilder('membership')
        .innerJoinAndSelect('membership.mentee', 'mentee')
        .where('membership.cohortId = :cohortId', {
          cohortId: assignment.cohortId,
        })
        .andWhere('membership.status = :membershipStatus', {
          membershipStatus: CohortMembershipStatus.ACTIVE,
        })
        .andWhere('mentee.status = :accountStatus', {
          accountStatus: AccountStatus.ACTIVE,
        })
        .andWhere('mentee.deletedAt IS NULL')
        .getMany();

      const sections = await sectionRepository.find({
        where: {
          trainingModuleId: assignment.trainingModuleId,
          isActive: true,
        },
        order: {
          displayOrder: 'ASC',
        },
      });

      const materials = sections.length
        ? await materialRepository.find({
            where: {
              moduleSectionId: In(
                sections.map((section) => section.id),
              ),
              isActive: true,
            },
            order: {
              displayOrder: 'ASC',
            },
          })
        : [];

      const initializedMenteeIds: string[] = [];

      for (const membership of memberships) {
        const menteeId = membership.menteeId;

        const existingProgress = await progressRepository.findOne({
          where: {
            menteeId,
            assignmentId,
          },
        });

        if (existingProgress) {
          continue;
        }

        const progress = await progressRepository.save(
          progressRepository.create({
            menteeId,
            assignmentId,
            progressPercentage: 0,
            status: ProgressStatus.NOT_STARTED,
            startedAt: null,
            completedAt: null,
          }),
        );

        if (sections.length > 0) {
          const sectionProgressRecords =
            await sectionProgressRepository.save(
              sections.map((section) =>
                sectionProgressRepository.create({
                  progressId: progress.id,
                  moduleSectionId: section.id,
                  status: SectionProgressStatus.NOT_STARTED,
                  startedAt: null,
                  completedAt: null,
                }),
              ),
            );

          const materialProgressRecords =
            sectionProgressRecords.flatMap((sectionProgress) =>
              materials
                .filter(
                  (material) =>
                    material.moduleSectionId ===
                    sectionProgress.moduleSectionId,
                )
                .map((material) =>
                  materialProgressRepository.create({
                    sectionProgressId: sectionProgress.id,
                    learningMaterialId: material.id,
                    watchedPercentage: 0,
                    lastPositionSeconds: 0,
                    status:
                      LearningMaterialProgressStatus.NOT_STARTED,
                    startedAt: null,
                    completedAt: null,
                  }),
                ),
            );

          if (materialProgressRecords.length > 0) {
            await materialProgressRepository.save(
              materialProgressRecords,
            );
          }
        }

        initializedMenteeIds.push(menteeId);
      }

      return {
        message: 'Mentee progress initialization completed.',
        assignmentId,
        totalActiveMentees: memberships.length,
        initializedCount: initializedMenteeIds.length,
        skippedCount:
          memberships.length - initializedMenteeIds.length,
        initializedMenteeIds,
      };
    });
  }

//mentee
   // Retrieve  the authenticated mentee's overall progress.
   
  async findMenteeProgress(menteeId: string) {
    return this.progressRepository.find({
      where: { menteeId },
      relations: {
        assignment: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  //mentorrr
   // Retrieve overall progress for mentees in the mentor's cohorts.
   
  async findMentorProgress(mentorId: string) {
    return this.progressRepository
      .createQueryBuilder('progress')
      .innerJoinAndSelect('progress.mentee', 'mentee')
      .innerJoinAndSelect('progress.assignment', 'assignment')
      .innerJoinAndSelect('assignment.cohort', 'cohort')
      .where('cohort.mentorId = :mentorId', { mentorId })
      .andWhere('mentee.status = :accountStatus', {
        accountStatus: AccountStatus.ACTIVE,
      })
      .andWhere('mentee.deletedAt IS NULL')
      .orderBy('progress.createdAt', 'DESC')
      .getMany();
  }

  // COUNTY MENTOR/RH:
   //Retrieve overall mentee progress and mentor-level summaries
   // within the County Mentor/RH user's assigned county.
   
  async findCountyProgress(countyMentorId: string) {
    // 1. Find the County Mentor/RH user's active county assignment.
    const organizationAssignmentRepository =
      this.dataSource.getRepository(UserOrganizationAssignment);

    const countyAssignments =
      await organizationAssignmentRepository.find({
        where: {
          userId: countyMentorId,
          level: OrganizationLevel.COUNTY,
          endDate: IsNull(),
        },
      });

    const countyIds = [
      ...new Set(
        countyAssignments
          .map((assignment) => assignment.countyId)
          .filter((countyId): countyId is string => !!countyId),
      ),
    ];

    if (countyIds.length === 0) {
      return {
        totalMentors: 0,
        totalMentees: 0,
        mentorSummaries: [],
        menteeProgress: [],
      };
    }

    // 2. Retrieve overall mentee progress within the assigned counties.
    const progressRecords = await this.progressRepository
      .createQueryBuilder('progress')
      .innerJoinAndSelect('progress.mentee', 'mentee')
      .innerJoinAndSelect('progress.assignment', 'assignment')
      .innerJoinAndSelect('assignment.cohort', 'cohort')
      .innerJoinAndSelect('cohort.mentor', 'mentor')
      .innerJoin('cohort.facility', 'facility')
      .innerJoin('facility.subCounty', 'subCounty')
      .innerJoin('subCounty.county', 'county')
      .where('county.id IN (:...countyIds)', { countyIds })
      .andWhere('mentee.status = :accountStatus', {
        accountStatus: AccountStatus.ACTIVE,
      })
      .andWhere('mentee.deletedAt IS NULL')
      .orderBy('progress.createdAt', 'DESC')
      .getMany();

    // 3. Group mentee progress by mentor.
    const mentorMap = new Map<
      string,
      {
        mentorId: string;
        mentorName: string;
        cohortIds: Set<string>;
        menteeIds: Set<string>;
        totalProgress: number;
        progressCount: number;
      }
    >();

    for (const record of progressRecords) {
      const mentor = record.assignment.cohort.mentor;
      const cohortId = record.assignment.cohort.id;

      let summary = mentorMap.get(mentor.id);

      if (!summary) {
        summary = {
          mentorId: mentor.id,
          mentorName: `${mentor.firstName} ${mentor.lastName}`,
          cohortIds: new Set<string>(),
          menteeIds: new Set<string>(),
          totalProgress: 0,
          progressCount: 0,
        };

        mentorMap.set(mentor.id, summary);
      }

      summary.cohortIds.add(cohortId);
      summary.menteeIds.add(record.menteeId);
      summary.totalProgress += Number(record.progressPercentage);
      summary.progressCount += 1;
    }

    // 4. Prepare mentor-level summaries.
    const mentorSummaries = Array.from(mentorMap.values()).map(
      (summary) => ({
        mentorId: summary.mentorId,
        mentorName: summary.mentorName,
        totalCohorts: summary.cohortIds.size,
        totalMentees: summary.menteeIds.size,
        averageProgress:
          summary.progressCount > 0
            ? Number(
                (
                  summary.totalProgress / summary.progressCount
                ).toFixed(2),
              )
            : 0,
      }),
    );

    // 5. Prepare individual mentee progress.
    const menteeProgress = progressRecords.map((record) => ({
      progressId: record.id,
      menteeId: record.menteeId,
      menteeName: `${record.mentee.firstName} ${record.mentee.lastName}`,
      mentorId: record.assignment.cohort.mentor.id,
      mentorName: `${record.assignment.cohort.mentor.firstName} ${record.assignment.cohort.mentor.lastName}`,
      cohortId: record.assignment.cohort.id,
      assignmentId: record.assignmentId,
      progressPercentage: Number(record.progressPercentage),
      status: record.status,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
    }));

    return {
      totalMentors: mentorSummaries.length,
      totalMentees: new Set(
        progressRecords.map((record) => record.menteeId),
      ).size,
      mentorSummaries,
      menteeProgress,
    };
  }

  //Retrieve one mentee's overall progress
   //for a specific cohort-module assignment
   
  async findByMenteeAndAssignment(
    menteeId: string,
    assignmentId: string,
  ) {
    const progress = await this.progressRepository.findOne({
      where: {
        menteeId,
        assignmentId,
      },
      relations: {
        mentee: true,
        assignment: true,
      },
    });

    if (!progress) {
      throw new NotFoundException(
        'Progress record not found.',
      );
    }

    return progress;
  }
}

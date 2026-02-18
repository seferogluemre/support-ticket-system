import type { Project, User } from '@onlyjs/db/client';
import { BaseFormatter } from '../../utils/base-formatter';
import { projectResponseDto } from './dtos';
import type { ProjectShowResponse } from './types';

type ProjectWithRelations = Project & {
  company: {
    id: number;
    uuid: string;
    name: string;
  };
  createdBy: Pick<User, 'id' | 'name'>;
};

export abstract class ProjectFormatter {
  static response(data: ProjectWithRelations): ProjectShowResponse {
    const convertedData = BaseFormatter.convertData<ProjectShowResponse>(
      {
        uuid: data.uuid,
        name: data.name,
        description: data.description,
        status: data.status,
        companyUuid: data.companyUuid,
        company: {
          uuid: data.company.uuid,
          name: data.company.name,
        },
        createdById: data.createdById,
        createdBy: {
          id: data.createdBy.id,
          name: data.createdBy.name,
        },
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
      projectResponseDto,
    );
    return convertedData;
  }
}
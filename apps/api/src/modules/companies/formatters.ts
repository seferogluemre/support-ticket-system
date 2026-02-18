import type { Company } from '@onlyjs/db/client';

type CompanyWithRelations = Company & {
  owner?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    image: string | null;
  } | null;
};

export abstract class CompanyFormatter {
  static response(company: CompanyWithRelations) {
    return {
      uuid: company.uuid,
      name: company.name,
      logoFileId: company.logoFileId,
      logoFileSrc: company.logoFileSrc,
      ownerUuid: company.ownerUuid,
      // Statistics
      membersCount: company.membersCount,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      deletedAt: company.deletedAt,
      // Include owner if exists
      ...(company.owner && {
        owner: {
          uuid: company.owner.id, // id is uuid in User model
          email: company.owner.email,
          firstName: company.owner.firstName,
          lastName: company.owner.lastName,
          name: company.owner.name,
          image: company.owner.image,
        },
      }),
    };
  }

}

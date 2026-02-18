import { type Static } from "elysia";
import { companyCreatePayload, companyResponseDto, companyUpdatePayload } from "./dtos";

export type CompanyResponse = Static<typeof companyResponseDto>;
export type CompanyCreatePayload = Static<typeof companyCreatePayload>;
export type CompanyUpdatePayload = Static<typeof companyUpdatePayload>;

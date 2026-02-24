import type { Tag } from "@onlyjs/db/client";
import { BaseFormatter } from "../../utils/base-formatter";
import { tagResponseDto } from "./dtos";
import type { TagShowResponse } from "./types";

export abstract class TagFormatter {
  static response(data: Tag) {
    const convertedData = BaseFormatter.convertData<TagShowResponse>(
      data,
      tagResponseDto,
    );
    return convertedData;
  }
}

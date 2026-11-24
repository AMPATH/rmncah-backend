import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../dto/api-success-response.dto.js';
import { PaginationMetaDto } from '../dto/pagination-meta.dto.js';

interface ApiSuccessResponseOptions {
  description: string;
  status?: number;
  isArray?: boolean;
  isPaginated?: boolean;
}

export function ApiStandardSuccessResponse(
  dataDto: Type<unknown>,
  options: ApiSuccessResponseOptions,
) {
  const dataSchema = options.isArray
    ? {
        type: 'array',
        items: {
          $ref: getSchemaPath(dataDto),
        },
      }
    : {
        $ref: getSchemaPath(dataDto),
      };

  const properties = {
    data: dataSchema,
    ...(options.isPaginated && {
      meta: {
        $ref: getSchemaPath(PaginationMetaDto),
      },
    }),
  };

  return applyDecorators(
    ApiExtraModels(ApiSuccessResponseDto, PaginationMetaDto, dataDto),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description,
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(ApiSuccessResponseDto),
          },
          {
            type: 'object',
            properties,
            required: options.isPaginated ? ['data', 'meta'] : ['data'],
          },
        ],
      },
    }),
  );
}

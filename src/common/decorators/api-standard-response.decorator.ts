import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export interface ApiStandardResponseOptions {
  status?: number;
  description?: string;
  /** DTO/entity class describing the `data` member. */
  type?: Type<unknown>;
  /** Set when `data` is an array of `type` (usually a paginated listing). */
  isArray?: boolean;
}

/**
 * Documents the envelope produced by `TransformInterceptor`
 * (`{ success, data, meta?, timestamp, path }`) instead of the raw handler
 * return type — otherwise the published contract and the real payload drift apart.
 */
export const ApiStandardResponse = (
  options: ApiStandardResponseOptions = {},
): MethodDecorator & ClassDecorator => {
  const {
    status = 200,
    description = 'Successful response',
    type,
    isArray,
  } = options;

  const dataSchema = type
    ? isArray
      ? { type: 'array', items: { $ref: getSchemaPath(type) } }
      : { $ref: getSchemaPath(type) }
    : {};

  const schema = {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: dataSchema,
      meta: {
        type: 'object',
        nullable: true,
        properties: {
          total: { type: 'number', example: 42 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 20 },
          totalPages: { type: 'number', example: 3 },
        },
      },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string', example: '/api/v1/tasks' },
    },
  };

  const decorators = [ApiResponse({ status, description, schema })] as Array<
    MethodDecorator | ClassDecorator
  >;

  if (type) {
    decorators.push(ApiExtraModels(type));
  }

  return applyDecorators(...decorators);
};

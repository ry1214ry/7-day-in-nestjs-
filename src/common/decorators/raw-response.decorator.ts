import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'rawResponse';

/**
 * Marks a route whose payload must bypass `TransformInterceptor`.
 * Required for binary/file/stream responses, where wrapping the body in JSON
 * would corrupt it.
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);

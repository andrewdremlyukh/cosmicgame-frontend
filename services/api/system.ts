import { apiGet, getAPIUrl, apiCall, apiCallRequired, flattenTxArray, pagedPath } from './client';
import type { ApiListRequestOptions, ApiRequestOptions } from './client';
import { SystemModeChangeEventSchema, safeValidateListSample } from './schemas';
import type { SystemModeChangeEvent, AdminEventRow } from './types';

/**
 * Fetches the current server timestamp (Unix seconds).
 *
 * Required read: every countdown is anchored to this sample, so a fallback of 0
 * would silently date the whole page to 1970 instead of reporting the failure.
 */
export function get_current_time(opts?: ApiRequestOptions): Promise<number> {
  return apiCallRequired(async () => {
    const { data } = await apiGet(getAPIUrl('time/current'), opts);
    return data.CurrentTimeStamp;
  });
}

/** Fetches the history of system-mode changes, optionally paged (maintenance, runtime, etc.). */
export function get_system_modelist(
  opts?: ApiListRequestOptions,
): Promise<SystemModeChangeEvent[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`system/modelist/${pagedPath(opts)}`), opts);
    return safeValidateListSample(
      SystemModeChangeEventSchema,
      flattenTxArray<SystemModeChangeEvent>(data.SystemModeChanges),
      'systemModelist',
    ) as SystemModeChangeEvent[];
  }, []);
}

/** Fetches admin events (deployments, config changes) within a time range. */
export function get_system_events(
  start: number,
  end: number,
  opts?: ApiRequestOptions,
): Promise<AdminEventRow[]> {
  return apiCall(async () => {
    const { data } = await apiGet(getAPIUrl(`system/admin_events/${start}/${end}`), opts);
    return flattenTxArray<AdminEventRow>(data.AdminEvents);
  }, []);
}

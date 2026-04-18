import type { ApiResult } from "./apiTypes";

export function login(email: string, password: string): Promise<ApiResult<any>>;
declare const _default: { login: typeof login };
export default _default;

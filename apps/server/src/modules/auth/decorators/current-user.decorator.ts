import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 현재 로그인한 유저 정보를 가져오는 데코레이터
 * @example @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

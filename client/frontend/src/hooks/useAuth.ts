import { useAuthContext } from '@/context/AuthContext';

export const useAuth = () => {
  const ctx = useAuthContext();
  return {
    ...ctx,
    hasRole: (roles: string | string[]) => {
      const roleName = ctx.user?.role_id?.role_name || ctx.user?.role?.name || '';
      if (Array.isArray(roles)) return roles.includes(roleName);
      return roleName === roles;
    },
    isAdmin: ['admin', 'super_admin'].includes(ctx.user?.role_id?.role_name || ctx.user?.role?.name || ''),
    isSupport: ctx.user?.role_id?.role_name === 'support',
    isCustomer: ctx.user?.role_id?.role_name === 'customer' || ctx.user?.role_id?.role_name === 'user',
  };
};

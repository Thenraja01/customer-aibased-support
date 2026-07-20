import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export function usePermissions() {
  const uiConfig = useSelector((state: RootState) => state.ui.ui_config);

  if (!uiConfig) {
    return {
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      hasFeature: () => false,
      permissions: {} as any,
      features: {} as any,
    };
  }

  const { permissions, features } = uiConfig;

  return {
    hasPermission: (permission: string) => permissions[permission as keyof typeof permissions] === true,
    hasAnyPermission: (perms: string[]) => perms.some(p => permissions[p as keyof typeof permissions] === true),
    hasAllPermissions: (perms: string[]) => perms.every(p => permissions[p as keyof typeof permissions] === true),
    hasFeature: (feature: string) => features[feature as keyof typeof features] === true,
    permissions,
    features,
  };
}

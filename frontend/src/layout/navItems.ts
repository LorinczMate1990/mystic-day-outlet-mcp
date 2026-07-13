export interface NavItem {
  to: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/email-settings', label: 'E-mail settings' },
  { to: '/test/email', label: 'Test' },
];

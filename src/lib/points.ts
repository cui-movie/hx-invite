/** 积分规则常量（MVP 不做复杂规则引擎） */
export const POINTS_RULES: Record<string, { points: number; label: string }> = {
  register: { points: 10, label: "客户注册留资" },
  open_account: { points: 50, label: "客户开户" },
};

export function getRulePoints(eventType: string): number | null {
  const rule = POINTS_RULES[eventType];
  return rule ? rule.points : null;
}

/**
 * パスワードポリシー
 * - 最低12文字
 * - 大文字を含む
 * - 小文字を含む
 * - 数字を含む
 * - 記号を含む
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("パスワードは12文字以上である必要があります");
  }

  if (password.length > 128) {
    errors.push("パスワードは128文字以下である必要があります");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("大文字（A-Z）を含める必要があります");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("小文字（a-z）を含める必要があります");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("数字（0-9）を含める必要があります");
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("記号（!@#$%^&*など）を含める必要があります");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * パスワード強度を計算（0-100）
 * 最低12文字の要件に合わせてスコアリング
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0;

  // 長さによるスコア（最低要件の12文字以上からスコア付与）
  if (password.length >= 12) strength += 25;
  if (password.length >= 16) strength += 15;

  // 文字種によるスコア
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength += 15;

  return Math.min(100, strength);
}

import {
  ConfigurationError,
  ValidationError as BaseValidationError,
} from "../../utils/errors";

/**
 * 设置未找到错误
 */
export class SettingsNotFoundError extends ConfigurationError {
  static readonly NAME = "SettingsNotFoundError" as const;

  constructor(message: string) {
    super(message);
    this.name = SettingsNotFoundError.NAME;
  }
}

/**
 * 设置验证错误
 */
export class SettingsValidationError extends BaseValidationError {
  static readonly NAME = "SettingsValidationError" as const;

  constructor(
    message: string,
    public readonly summary: string,
  ) {
    super(message);
    this.name = SettingsValidationError.NAME;
  }
}

/**
 * 设置更新错误
 */
export class SettingsUpdateError extends ConfigurationError {
  static readonly NAME = "SettingsUpdateError" as const;

  constructor(
    message: string,
    public readonly summary: string,
  ) {
    super(message);
    this.name = SettingsUpdateError.NAME;
  }
}

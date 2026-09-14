class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = options.statusCode || 0;
    this.details = options.details || null;
    this.retryable = Boolean(options.retryable);
  }

  static fromResponse(statusCode, payload) {
    const error = payload && payload.error ? payload.error : {};
    return new AppError(
      error.code || `HTTP_${statusCode}`,
      error.message || '服务暂时不可用，请稍后重试',
      { statusCode, details: error.details, retryable: statusCode >= 500 },
    );
  }
}

module.exports = AppError;

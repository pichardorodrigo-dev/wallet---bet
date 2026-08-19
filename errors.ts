export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const Errors = {
  badRequest: (msg: string) => new ApiError(400, msg),
  unauthorized: (msg = "No autorizado") => new ApiError(401, msg),
  forbidden: (msg = "Prohibido") => new ApiError(403, msg),
  notFound: (msg = "No encontrado") => new ApiError(404, msg),
  conflict: (msg: string) => new ApiError(409, msg),
};

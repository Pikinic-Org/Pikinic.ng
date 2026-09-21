// Thrown by services for expected, user-facing failures so controllers can
// map them to an HTTP status without string-matching error messages.
export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class LocalFileParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalFileParsingError";
  }
}

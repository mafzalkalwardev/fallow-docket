declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }

  export class StatementSync {
    run(
      ...params: Array<string | number | bigint | null>
    ): { changes: number | bigint; lastInsertRowid: number | bigint };
    get(...params: Array<string | number | bigint | null>): unknown;
    all(...params: Array<string | number | bigint | null>): unknown[];
  }
}

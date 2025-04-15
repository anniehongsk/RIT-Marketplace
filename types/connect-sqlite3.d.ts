declare module 'connect-sqlite3' {
  import * as session from 'express-session';
  
  export default function connectSqlite3(
    options: connectSqlite3.ConnectSqlite3Options
  ): (
    session: typeof session
  ) => new (options: connectSqlite3.StoreOptions) => session.Store;
  
  namespace connectSqlite3 {
    interface ConnectSqlite3Options {
      [key: string]: any;
    }
    
    interface StoreOptions {
      dir?: string;
      db?: string;
      table?: string;
      concurrentDB?: boolean;
      [key: string]: any;
    }
  }
}
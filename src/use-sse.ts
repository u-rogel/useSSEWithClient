import { useContext, useEffect, useState } from "react";
import { SSEContext } from "./sse-context";

export const useSSE = <T>(type: string, callback: (data: T) => void) => {
  const { connection, status } = useContext(SSEContext);

  useEffect(() => {
    if (status !== EventSource.OPEN) {
      return;
    }
    console.log("listening");

    if (connection == null) {
      return;
    }

    function listener(this: EventSource, event: MessageEvent<any>) {
      console.log("event arrived");

      const data = JSON.parse(event.data);
      callback(data);
    }
    console.log(`event listened: ${type}`);

    connection?.addEventListener(type, listener);

    return function cleanup() {
      console.log("useSSE -> cleanup");

      connection?.removeEventListener(type, listener);
    };
  }, [connection, status]);
};

export const useSSEValue = <T>(type: string) => {
  const [value, setValue] = useState<T>();

  useSSE<T>(type, setValue);

  return value;
};

// import { useEffect, useState } from "react";

// type SSEBase = {
//   url: string;
//   withCredentials?: boolean;
// };

// type TypeShouldBeFunction = (param: never) => never;

// type SSE<T> = {
//   [Key in keyof T]: Key extends keyof SSEBase
//   ? SSEBase[Key]
//   : T[Key] extends (message: any) => void
//   ? T[Key]
//   : TypeShouldBeFunction;
// };

// type SSEStatus = {
//   isConnected: boolean;
//   error?: Error;
// };

// export function useSSE<T>({
//   url,
//   withCredentials = false,
//   ...handlers
// }: SSEBase & SSE<T>): SSEStatus {
//   const [isConnected, setIsConnected] = useState(false);
//   const [error, setError] = useState<Error | undefined>();

//   useEffect(() => {
//     const evtSource = new EventSource(url, {
//       withCredentials,
//     });

//     const onConnect = () => setIsConnected(true);
//     evtSource.addEventListener("open", onConnect);

//     const onError = (e: any) => setError(e);
//     evtSource.addEventListener("error", onError);

//     const listeners: [
//       string,
//       (this: EventSource, event: MessageEvent<any>) => void
//     ][] = [];

//     Object.entries(handlers).forEach((nameAndCallback) => {
//       const [name, callback] = nameAndCallback as [
//         string,
//         (message: any) => void
//       ];
//       function listener(this: EventSource, event: MessageEvent<any>) {
//         const data = JSON.parse(event.data);
//         callback(data);
//       }

//       listeners.push([name, listener]);

//       evtSource.addEventListener(name, listener);
//     });

//     return function cleanup() {
//       evtSource.removeEventListener("open", onConnect);
//       evtSource.removeEventListener("error", onError);

//       listeners.forEach(([name, listener]) => {
//         evtSource.removeEventListener(name, listener);
//       });
//     };
//   }, [url, withCredentials]);

//   return {
//     isConnected,
//     error,
//   };
// }

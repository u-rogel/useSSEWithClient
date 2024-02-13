import React, { useContext, useEffect, useMemo, useState } from "react";

// https://developer.mozilla.org/en-US/docs/Web/API/EventSource/readyState
// 0 — connecting
// 1 — open
// 2 — closed

type Status =
  | EventSource["CLOSED"]
  | EventSource["OPEN"]
  | EventSource["CONNECTING"];

type SSE = {
  status: Status;
  connection: null | EventSource;
};

export const SSEContext = React.createContext<SSE>({
  status: EventSource.CONNECTING,
  connection: null,
});

type SSEContextProviderProps = React.PropsWithChildren<{
  url: string;
  withCredentials?: boolean;
}>;

export const SSEContextProvider: React.FC<SSEContextProviderProps> = ({
  url,
  withCredentials = false,
  children,
}) => {
  const [status, setStatus] = useState<Status>(EventSource.CONNECTING);

  const connection = useMemo(() => {
    const cnn = new EventSource(url, { withCredentials });
    cnn.addEventListener("open", () => {
      setStatus(EventSource.OPEN);
    });
    return cnn;
  }, [url, withCredentials]);

  return (
    <SSEContext.Provider
      value={{
        status,
        connection,
      }}
    >
      {children}
    </SSEContext.Provider>
  );
};

export const useSSE = (type: string, callback: (data: unknown) => void) => {
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

export const useSSEValue = (type: string) => {
  const [value, setValue] = useState<unknown>();

  useSSE(type, (v) => setValue(v));

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

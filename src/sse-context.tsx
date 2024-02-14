import React, { useMemo, useState } from "react";

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

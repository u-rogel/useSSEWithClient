import { useContext, useEffect } from "react";
import { SSEContext } from "./sse-context";

export const useSSE = <T>(
  type: string,
  sub: () => void,
  callback: (event: T) => void
) => {
  const { connection, status } = useContext(SSEContext);

  useEffect(() => {
    if (status !== EventSource.OPEN || connection == null) {
      return;
    }

    function listener(this: EventSource, event: MessageEvent<any>) {
      const data = JSON.parse(event.data);
      callback(data);
    }

    connection?.addEventListener(type, listener);

    sub()

    return function cleanup() {
      connection?.removeEventListener(type, listener);
    };
  }, [connection, status]);
};

// export const useSSEValue = <T>(type: string) => {
//   const [value, setValue] = useState<T>();

//   useSSE<T>(type, setValue);

//   return value;
// };

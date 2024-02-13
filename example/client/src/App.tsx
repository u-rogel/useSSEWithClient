import { useEffect, useState } from "react";
import "./App.css";
import { User } from "./types";
import Login from "./Login";
import Chat from "./Chat";
import { SSEContextProvider } from "use-sse";

function App() {
  // const { isConnected } = useSSE({
  //   url: "http://localhost:3000/sse-register",
  //   path: '/rooms/get',
  //   event: {
  //     message: (data: { num: number }) => {
  //       console.log("🚀 ~ num:", data.num);
  //     },
  //   },
  //   // withCredentials: true,
  //   message: (data: { num: number }) => {
  //     console.log("🚀 ~ num:", data.num);
  //   },
  //   ping: (counter: number) => {
  //     console.log("🚀 ~ counter:", counter);
  //   },
  // });

  const [user, setUser] = useState<User | null>(null);
  const [sseConn, setSseConn] = useState<EventSource | null>(null);

  useEffect(() => {
    const localUser = localStorage.getItem("userId");
    if (localUser != null) {
      const foundLocalUserId = +localUser;

      fetch("http://localhost:3001/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: foundLocalUserId }),
      })
        .then<User>((res) => res.json())
        .then((res) => {
          setUser(res);
        })
        .catch((err) => {
          console.log({ err });
        });
    }
  }, []);

  if (user == null) {
    return (
      <Login
        onLogin={(user) => {
          localStorage.setItem("userId", `${user.id}`);
          setUser(user);
          // setSseConn(sse);
        }}
      />
    );
  }

  return (
    <SSEContextProvider
      url={`http://localhost:3001/sse-register?userId=${user.id}`}
    >
      <Chat userId={user.id} />
    </SSEContextProvider>
  );
}

export default App;

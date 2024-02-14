import React, { useState } from "react";
import { User } from "./types";

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  return (
    <div>
      <h3>Login</h3>
      <div>
        <input
          placeholder="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        />
        <button
          onClick={() => {
            fetch("http://localhost:3001/users", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ username }),
            })
              .then<User>((res) => res.json())
              .then((res) => {
                onLogin(res);
              })
              .catch((err) => {
                console.log({ err });
              });
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;

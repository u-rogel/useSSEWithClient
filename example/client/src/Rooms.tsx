import React, { useCallback, useEffect, useState } from "react";
import { Room, User } from "./types";
import useStateRef from "react-usestateref";
import { useSSE } from "use-sse";

interface RoomsProps {
  userId: User["id"];
  selectedRoomId: Room["id"] | null;
  onRoomSelect: (roomId: Room["id"]) => void;
}

const Rooms: React.FC<RoomsProps> = ({
  userId,
  selectedRoomId,
  onRoomSelect,
}) => {
  const [rooms, setRooms, roomsRef] = useStateRef<Omit<Room, "userIds">[]>([]);
  const [newRoom, setNewRoom] = useState("");

  const newData = useCallback((res: { type: "INIT" | "ADD"; data: Room[] }) => {
    if (res.type === "INIT") {
      setRooms(res.data);
    } else if (res.type === "ADD") {
      setRooms([...roomsRef.current, ...res.data]);
    }
  }, []);

  useSSE(
    "rooms",
    () => (
      fetch("http://localhost:3001/rooms/stream", {
        headers: {
          "User-Id": localStorage.getItem("userId")!,
        },
      })
        .then<{ success: boolean }>((res) => res.json())
    ),
    newData,
  );

  useEffect(() => {
    return () => {
      setRooms([])
    }
  }, []);

  return (
    <div style={{ border: "1px solid black", flex: 1, minHeight: "200px" }}>
      <h4>Rooms</h4>
      <div>
        {rooms.map((room) => {
          return (
            <div key={room.id} style={{ display: "flex", padding: "10px" }}>
              <span
                onClick={() => {
                  Promise.all([
                    selectedRoomId != null
                      ? fetch(`http://localhost:3001/rooms/${selectedRoomId}/users/leave`, {
                        method: "PATCH",
                        headers: {
                          "User-Id": localStorage.getItem("userId")!,
                        },
                      }).then((res) => res.json())
                      : Promise.resolve(),
                    fetch(`http://localhost:3001/rooms/${room.id}/users/join`, {
                      method: "PATCH",
                      headers: {
                        "User-Id": localStorage.getItem("userId")!,
                      },
                    }).then((res) => res.json()),
                  ]).then(() => {
                    onRoomSelect(room.id);
                  });
                }}
                style={{ color: "#7f7f7f", width: "100px", textAlign: "end" }}
              >
                {room.name}:
              </span>
              {selectedRoomId === room.id && (
                <span style={{ marginLeft: "25px" }}>{"<="}</span>
              )}
            </div>
          );
        })}
      </div>
      <div>
        <input
          type="text"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
        />
        <button
          onClick={() => {
            fetch("http://localhost:3001/rooms/new", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Id": localStorage.getItem("userId")!,
              },
              body: JSON.stringify({ userId, name: newRoom }),
            })
              .then<{ success: boolean }>((res) => res.json())
              .then((res) => {
                if (res.success) {
                  setNewRoom("");
                } else {
                  setNewRoom("");
                }
              });
          }}
        >
          add room
        </button>
      </div>
    </div>
  );
};

export default Rooms;

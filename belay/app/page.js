"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'

export default function Splash() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [reactions, setReactions] = useState({});
  const [activeView, setActiveView] = useState('channelList');
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 768);
  const [activeChannel, setActiveChannel] = useState(null);
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");
  const [unreadChannelCounts, setUnreadChannelCounts] = useState([]);

  const apiKey = localStorage.getItem("larguello1_belay_api_key");

  const addReaction = (messageId, emoji) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), emoji],
    }));
  };

  const router = useRouter();

  useEffect(() => {
    if (!apiKey) {
      router.push("/login");
    }
  }, [apiKey, router]);

  const handleChannelSelect = (channel) => {
    setActiveChannel(channel);
    setActiveView('messages');
    router.push(`/channel/${channel.name}`);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth > 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  useEffect(() => {
    if (apiKey) {
      // Fetch user data from your API
      fetch(`http://localhost:8000/api/user?api_key=${apiKey}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }
          return response.json()
        })
        .then((data) => {
          if (data.name) {
            setUser(data);
          } else {
            console.log("No username")
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, [apiKey, router]);

  useEffect(() => {
    if (apiKey) {
      fetch(`http://localhost:8000/api/channels?api_key=${apiKey}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch channels");
          }
          return response.json();
        })
        .then((data) => {
          if (data.channels) {
            setChannels(data.channels);
          } else {
            console.log("No channels found");
          }
        })
        .catch((error) => {
          console.error("Error fetching channels:", error);
        });
    }
  }, [apiKey]);

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) {
      alert("Channel name cannot be empty.");
      return;
    }

    fetch("http://localhost:8000/api/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        name: newChannelName,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to create channel");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data.message);
        setNewChannelName("");
        setIsOverlayVisible(false);
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error creating channel:", error);
      });
  };

  useEffect(() => {
    if (apiKey) {
      const fetchUnreadCounts = () => {
        fetch(`http://localhost:8000/api/user/channels/unread_counts?api_key=${apiKey}`, {
          method: 'GET',
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to get unread messages counts");
            }
            return response.json();
          })
          .then((data) => {
            if (data.unread_counts) {
              setUnreadChannelCounts(data.unread_counts);
              console.log(data.unread_counts);
              console.log(unreadChannelCounts);
            }
            else {
              console.log("unread counts not found");
            }
          })
          .catch((error) => {
            console.error("Error gettting unread counts", error);
          });
      }

      fetchUnreadCounts();
      const intervalId = setInterval(fetchUnreadCounts, 1000);

      return () => clearInterval(intervalId);
    }
  }, [apiKey])

  useEffect(() => {
    console.log("Unread Channel Counts updated:", unreadChannelCounts);
  }, [unreadChannelCounts]);

  const getUnreadCount = (channelId) => {
    const channel = unreadChannelCounts.find((c) => c.channel_id === channelId);
    return channel ? channel.unread_count : 0; // Return unread count or 0 if not found
  };

  return (
    <div className={styles.appContainer}>
      <div className={styles.splashContainer}>

        {/* Left Sidebar */}
        {isWideScreen || activeView === 'channelList' ? (
          <div className={styles.sidebar}>
            <button
              className={styles.createChannelButton}
              onClick={() => setIsOverlayVisible(true)}
            >
              + Create Channel
            </button>
            <ul className={styles.channelList}>
              {channels.map((channel) => (
                <li
                  key={channel.id}
                  className={styles.channel}
                  onClick={() => handleChannelSelect(channel)}
                >
                  #{channel.name} ({getUnreadCount(channel.id)})
                </li>
              ))}
            </ul>
            <Link href="profile">
              <button className={styles.profileButton}>
                {user ? `${user.name}'s Profile` : 'Loading...'}
              </button>
            </Link>
          </div>
        ) : null};

        <div className={styles.emptyMessageContainer}>
          <p>Click on a channel to see messages</p>
        </div>

        {/* Overlay for Creating Channel */}
        {isOverlayVisible && (
          <div className={styles.overlay}>
            <div className={styles.overlayContent}>
              <h3 className={styles.overlayHead}>Create a New Channel</h3>
              <input
                type="text"
                placeholder="Enter channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)} />
              <button onClick={handleCreateChannel}>Create</button>
              <button onClick={() => setIsOverlayVisible(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}


"use client"

import styles from "../../../page.module.css"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'

export default function RepliesPage({ params: paramsPromise }) {
    const [params, setParams] = useState(null);
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [repliesVisible, setRepliesVisible] = useState(false);
    const [currentMessage, setCurrentMessage] = useState(null);
    const [activeMessage, setActiveMessage] = useState(null);
    const [reactions, setReactions] = useState({});
    const [activeReply, setActiveReply] = useState(null);
    const [activeView, setActiveView] = useState('replies');
    const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 768);
    const [activeChannel, setActiveChannel] = useState(null);
    const [user, setUser] = useState(null);
    const [channels, setChannels] = useState([]);
    const [newChannelName, setNewChannelName] = useState("");
    const [messageText, setMessageText] = useState("");
    const [channelId, setChannelId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [replies, setReplies] = useState([]);
    const [pollingInterval, setPollingInterval] = useState(null);
    const [replyBody, setReplyBody] = useState("");
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

    useEffect(() => {
        const unwrapParams = async () => {
            const resolvedParams = await paramsPromise;
            setParams(resolvedParams);
        };
        unwrapParams();
    }, [paramsPromise]);

    useEffect(() => {
        if (params) {
            const foundMessage = messages.find((msg) => msg.id === Number(params.message_id));
            setCurrentMessage(foundMessage || null);
        }
    }, [params, messages]);

    useEffect(() => {
        let intervalId;
    
        if (apiKey && params && params.message_id) {
            const messageId = params.message_id;
    
            // Function to fetch replies
            const fetchReplies = () => {
                fetch(`http://localhost:8000/api/messages/${messageId}/replies?api_key=${apiKey}`)
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Failed to fetch replies");
                        }
                        return response.json();
                    })
                    .then((data) => {
                        if (data.replies) {
                            setReplies(data.replies);
                            console.log(replies); // Log the replies to debug
                        } else {
                            console.log("No replies found");
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching replies:", error);
                    });
            };
    
            // Initial fetch
            fetchReplies();
    
            // Set up polling every 0.5 seconds
            intervalId = setInterval(fetchReplies, 500);
        }
    
        // Cleanup function to stop polling
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                console.log("Stopped polling for replies");
            }
        };
    }, [apiKey, params]);

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

    var channel_name = params ? params.channel_id : "Loading...";

    const handleShowReplies = (message) => {
        setCurrentMessage(message);
        setRepliesVisible(true);
        router.push(`/channel/${channel_name}/${message.id}`)
    }

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

    useEffect(() => {
        if (apiKey && params && params.channel_id) {
            const channel_name = params.channel_id;
            fetch(`http://localhost:8000/api/channel/${channel_name}/id?api_key=${apiKey}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to get channel id");
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.id) {
                        setChannelId(data.id);
                    } else {
                        console.log("Channel id not found");
                    }
                })
                .catch((error) => {
                    console.error("Error getting channel id:", error)
                })
        }
    }, [apiKey, params])

    useEffect(() => {
        if (apiKey && channelId) {
            const fetchMessages = () => {
                fetch(`http://localhost:8000/api/channel/${channelId}/messages?api_key=${apiKey}`)
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Failed to fetch messages");
                        }
                        return response.json();
                    })
                    .then((data) => {
                        if (data.messages) {
                            setMessages(data.messages); // Update messages state
                        } else {
                            console.log("No messages found");
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching messages:", error);
                    });
            };

            // Set polling interval to 0.5 seconds (500ms)
            const intervalId = setInterval(fetchMessages, 500);
            setPollingInterval(intervalId);

            // Cleanup the interval when leaving the channel or when the component unmounts
            return () => {
                clearInterval(intervalId); // Stop polling when the channel is changed
                setPollingInterval(null);
            };
        }
    }, [apiKey, channelId]);

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

    const handlePostMessage = () => {
        if (!messageText.trim()) {
            alert("Message cannot be empty.");
            return;
        }

        fetch(`http://localhost:8000/api/channel/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
                body: messageText.trim(),
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to post message");
                }
                return response.json();
            })
            .then((data) => {
                setMessageText(""); // Clear the textarea
            })
            .catch((error) => {
                console.error("Error posting message:", error);
            });
    };

    const handlePostReply = () => {
        if (!replyBody.trim()) {
            alert("Message cannot be empty");
            return;
        }

        fetch(`http://localhost:8000/api/messages/${params.message_id}/replies`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
                body: replyBody.trim(),
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to post reply");
                }
                return response.json();
            })
            .then((data) => {
                setReplyBody("");
            })
            .catch((error) => {
                console.error("Error posting reply:", error);
            })
    }

    useEffect(() => {
        if (apiKey && channelId && messages.length > 0) {
            const lastMessageId = messages[messages.length - 1].id; // Get the ID of the last message
    
            fetch(`http://localhost:8000/api/user/channels/${channelId}/last_read`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    last_read_message_id: lastMessageId,
                }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to update last message read");
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log("Last message read updated:", data.message);
                })
                .catch((error) => {
                    console.error("Error updating last message read:", error);
                });
        }
    }, [messages, apiKey, channelId]);

    useEffect(() => {
        if (apiKey && channelId && messages.length > 0) {
            const lastMessageId = messages[messages.length - 1].id; // Get the ID of the last message

            fetch(`http://localhost:8000/api/user/channels/${channelId}/last_read`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    last_read_message_id: lastMessageId,
                }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to update last message read");
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log("Last message read updated:", data.message);
                })
                .catch((error) => {
                    console.error("Error updating last message read:", error);
                });
        }
    }, [messages, apiKey, channelId]);

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
                                    className={`${channel_name === channel.name ? styles.activeChannel : styles.channel}`}
                                    onClick={() => handleChannelSelect(channel)}
                                >
                                    #{channel.name} ({getUnreadCount(channel.id)})
                                </li>
                            ))}
                        </ul>
                        <Link href="/profile">
                            <button className={styles.profileButton}>
                                {user ? `${user.name}'s Profile` : 'Loading...'}
                            </button>
                        </Link>
                    </div>
                ) : null};

                {/* Messages Section */}
                {isWideScreen || activeView === 'messages' ? (
                    <div className={repliesVisible ? styles.messagesContainerWithReplies : styles.messagesContainer}>
                        <div className={styles.messagesHeader}>
                            {/* Hamburger menu for narrow screens */}
                            {!isWideScreen && (
                                <button
                                    className={styles.hamburgerMenu}
                                    onClick={() => setActiveView('channelList')}
                                >
                                    ☰
                                </button>
                            )}

                            <div className={styles.channelName}>
                                {channel_name}
                            </div>
                        </div>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={styles.message}
                                onMouseEnter={() => setActiveMessage(message.id)}
                                onMouseLeave={() => setActiveMessage(null)}
                            >
                                <div className={styles.messageActions} style={{ display: activeMessage === message.id ? 'flex' : 'none' }}>
                                    <button className={styles.replyButton} onClick={() => handleShowReplies(message)}>
                                        <span role="img" aria-label="reply">💬</span>
                                    </button>
                                    <div className={styles.reactions}>
                                        <button onClick={() => addReaction(message.id, "👍")}>👍</button>
                                        <button onClick={() => addReaction(message.id, "❤️")}>❤️</button>
                                        <button onClick={() => addReaction(message.id, "😂")}>😂</button>
                                    </div>
                                </div>
                                <div className={styles.authorContainer}>
                                    <div className={styles.author}>{message.author}</div>
                                    <div className={styles.timestamp}>{message.timestamp}</div>
                                </div>
                                {message.text && (message.text.match(/\bhttps?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)\b/i) ? (
                                    <img src={message.text} alt="User posted image" className={styles.imageMessage} />
                                ) : (
                                    <p>{message.text}</p>
                                ))}
                                {message.replies > 0 && (
                                    <button
                                        className={styles.repliesLink}
                                        onClick={() => {
                                            handleShowReplies(message)
                                            setActiveView('replies')
                                        }}
                                    >
                                        {message.replies} {message.replies === 1 ? "Reply" : "Replies"}
                                    </button>
                                )}
                                {reactions[message.id] && (
                                    <div className={styles.reactionBar}>
                                        {reactions[message.id].map((reaction, index) => (
                                            <span key={index}>{reaction}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className={styles.textAreaContainer}>
                            <textarea
                                className={styles.messageTextArea}
                                placeholder="Type your message here..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                            ></textarea>
                            <button className={styles.sendButton} onClick={handlePostMessage}>Send</button>
                        </div>
                    </div>
                ) : null};

                {/* Replies Section */}
                {(isWideScreen && repliesVisible && currentMessage) || (!isWideScreen && activeView === 'replies' && currentMessage) ? (
                    <div className={styles.repliesContainer}>
                        <div className={styles.repliesHeader}>
                            <h3 className={styles.repliesTitle}>Replies</h3>
                            <button
                                className={styles.closeRepliesButton}
                                onClick={() => {
                                    setRepliesVisible(false)
                                    setActiveView('messages')
                                    router.push(`/channel/${channel_name}`)
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Original Message */}
                        <div className={styles.originalMessage}>
                            <div className={styles.messageHeader}>
                                <div className={styles.authorContainer}>
                                    <div className={styles.author}>{currentMessage.author}</div>
                                    <div className={styles.timestamp}>{currentMessage.timestamp}</div>
                                </div>
                                <div className={styles.messageActionsAlwaysVisible}>
                                    <div className={styles.reactions}>
                                        <button onClick={() => addReaction(currentMessage.id, "👍")}>👍</button>
                                        <button onClick={() => addReaction(currentMessage.id, "❤️")}>❤️</button>
                                        <button onClick={() => addReaction(currentMessage.id, "😂")}>😂</button>
                                    </div>
                                </div>
                            </div>
                            {currentMessage.text && (currentMessage.text.match(/\bhttps?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)\b/i) ? (
                                    <img src={currentMessage.text} alt="User posted image" className={styles.imageMessage} />
                                ) : (
                                    <p>{currentMessage.text}</p>
                                ))}
                        </div>
                        <hr />

                        {/* Replies */}
                        {replies
                            .map((reply) => (
                                <div
                                    key={reply.id}
                                    className={styles.reply}
                                    onMouseEnter={() => setActiveReply(reply.id)}
                                    onMouseLeave={() => setActiveReply(null)}
                                >
                                    <div className={styles.messageActions} style={{ display: activeReply === reply.id ? 'flex' : 'none' }}>
                                        <div className={styles.reactions}>
                                            <button onClick={() => addReaction(reply.id, "👍")}>👍</button>
                                            <button onClick={() => addReaction(reply.id, "❤️")}>❤️</button>
                                            <button onClick={() => addReaction(reply.id, "😂")}>😂</button>
                                        </div>
                                    </div>
                                    <div className={styles.authorReplyContainer}>
                                        <div className={styles.author}>{reply.author}</div>
                                        <div className={styles.timestamp}>{reply.timestamp}</div>
                                    </div>
                                    {reply.text && (reply.text.match(/\bhttps?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)\b/i) ? (
                                    <img src={reply.text} alt="User posted image" className={styles.imageMessage} />
                                ) : (
                                    <p>{reply.text}</p>
                                ))}
                                </div>
                            ))}
                        <div className={styles.textAreaContainer}>
                            <textarea 
                                className={styles.messageTextArea} 
                                placeholder="Type your reply here..."
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}></textarea>
                            <button className={styles.sendButton} onClick={handlePostReply}>Send</button>
                        </div>
                    </div>
                ) : null}

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
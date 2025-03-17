CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(40) UNIQUE,
    password VARCHAR(40),
    api_key VARCHAR(40)
);

CREATE TABLE channels (
    id INTEGER PRIMARY KEY,
    name VARCHAR(40) UNIQUE
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    channel_id INTEGER,
    body TEXT,
    replies_to INTEGER,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channel_id) REFERENCES channels(id),
    FOREIGN KEY (replies_to) REFERENCES messages(id)
);

CREATE TABLE reactions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    message_id INTEGER,
    emoji TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (message_id) REFERENCES messages(id),
    UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE userChannelLastRead (
    user_id INTEGER,
    channel_id INTEGER,
    last_read_message_id INTEGER,
    PRIMARY KEY (user_id, channel_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channel_id) REFERENCES channels(id)
);

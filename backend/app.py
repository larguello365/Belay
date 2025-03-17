import sqlite3
import os
import string
import random
import datetime
from flask import Flask, g, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="http://localhost:3000")

DATABASE = 'db/belay.sqlite3'
SQL_FILE_PATH = os.path.join('db', 'create_tables.sql')

def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/belay.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with sqlite3.connect(DATABASE) as conn:
        with open(SQL_FILE_PATH, 'r') as f:
            conn.executescript(f.read())
            
def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400
    
    try:
         user = query_db('SELECT * FROM users WHERE name = ? AND password = ?', (username, password), one=True)
         
         if user:
             return jsonify({"message": "Login successful", 'api_key': user['api_key']}), 200
         else:
             return jsonify({"error": "Invalid credentials"}), 401
    except sqlite3.Error as e:
        return jsonify({"error": "Error during login", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500
    
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400
    
    # check if user already exists
    existing_user = query_db('SELECT * FROM users WHERE name = ?', [username], one=True)
    if existing_user:
        return jsonify({"error": "Username already exists"}), 409
    
    api_key = ''.join(random.choices(string.ascii_letters + string.digits, k=40))
    
    try:
        # Insert new user into database
        query_db('INSERT INTO users (name, password, api_key) VALUES (?, ?, ?)', 
                 [username, password, api_key])

        return jsonify({"message": "Account created successfully", "api_key": api_key}), 200
    except sqlite3.Error as e:
        # Handle database error
        return jsonify({"error": "Error creating account", "details": str(e)}), 500
    except Exception as e:
        # Handle unexpected error
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

@app.route('/api/user', methods=['GET'])
def get_user():
    api_key = request.args.get('api_key')
    
    try:
        user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
        
        if user:
            return jsonify(dict(user)), 200
        else:
            return jsonify({"error": "Invalid API Key"}), 401
    
    except sqlite3.Error as e:
        return jsonify({"error": "Error getting user", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

@app.route('/api/user/name', methods=['POST'])
def update_username():
    data = request.get_json()
    api_key = data.get('api_key')
    new_name = data.get('username')
    
    if not api_key or not new_name:
        return jsonify({"error": "API key and new username are required."}), 400
    
    try:
        # Check if user exists with the provided API key
        user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
        
        if not user:
            return jsonify({"error": "Invalid API key or user does not exist."}), 401

        # Update the username for the user
        query_db('UPDATE users SET name = ? WHERE api_key = ?', (new_name, api_key))
        return jsonify({"message": "Username updated successfully"}), 200

    except sqlite3.IntegrityError as e:
        return jsonify({"error": "Username already in use", "details": str(e)}), 409

    except sqlite3.Error as e:
        return jsonify({"error": "Error updating username", "details": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

@app.route('/api/user/password', methods=['POST'])
def update_password():
    data = request.get_json()
    api_key = data.get('api_key')
    new_password = data.get('password')
    
    if not api_key or not new_password:
        return jsonify({"error": "API key and new password are required"}), 400
    
    try:
        user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
        
        if not user:
            return jsonify({"error": "Invalid API key or user does not exist"}), 401
        
        query_db('UPDATE users SET password = ? WHERE api_key = ?', (new_password, api_key))
        return jsonify({"message": "Password updated successfully"}), 200
    
    except sqlite3.Error as e:
        return jsonify({"error": "Error updating password", "details": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

@app.route('/api/channels', methods=['GET'])
def get_channels():
    api_key = request.args.get('api_key')
   
    try:
        user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
        
        if not user:
            return jsonify({"error": "Invalid API key or user does not exist"}), 401
        
        channels = query_db('SELECT * FROM channels')
        channels_list = []
        
        if channels:
            channels_list = [{"id": channel[0], "name": channel[1]} for channel in channels]
        
        return jsonify({"message": "Channels retrieved successfully", "channels": channels_list}), 200
     
    except sqlite3.Error as e:
        return jsonify({"error": "Error getting channels", "details": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500
 
@app.route('/api/channels', methods=['POST'])
def create_channel():
    data = request.get_json()
    api_key = data.get('api_key')
    channel_name = data.get('name')
    
    try:
        user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
        
        if not user:
            return jsonify({"error": "Invalid API key or user does not exist"}), 401
        
        query_db(
            'INSERT INTO channels (name) VALUES (?)',
            (channel_name,),
            one=True)
        return jsonify({"message": "Channel created successfully"}), 201
    
    except sqlite3.Error as e:
        return jsonify({"error": "Error getting channels", "details": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

@app.route('/api/channel/<string:channel_name>/id', methods=['GET'])
def get_channel_id(channel_name):
    api_key = request.args.get('api_key')
    
    try:
        user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
        
        if not user:
            return jsonify({"error": "Invalid API key or user does not exist."}), 401
        
        # Query the database to find the channel ID based on the channel name
        channel = query_db('SELECT id FROM channels WHERE name = ?', [channel_name], one=True)

        # If the channel doesn't exist, return a 404 error
        if not channel:
            return jsonify({"error": "Channel not found"}), 404

        # Return the channel ID as a JSON response
        return jsonify({"id": channel['id']}), 200

    except Exception as e:
        # Handle unexpected server errors
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
    
@app.route('/api/channel/<int:channel_id>/messages', methods=['GET'])
def get_messages(channel_id):
    api_key = request.args.get('api_key')
    
    try:
        user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
        
        if not user:
            return jsonify({"error": "Invalid API key or user does not exist."}), 401
        
        messages = query_db(
            '''
            SELECT 
                messages.id, 
                messages.body AS text, 
                messages.created_at AS timestamp, 
                users.name AS author,
                COALESCE(COUNT(replies.id), 0) AS replies
            FROM messages
            JOIN users ON messages.user_id = users.id
            LEFT JOIN messages AS replies ON replies.replies_to = messages.id
            WHERE messages.channel_id = ? AND messages.replies_to IS NULL
            GROUP BY messages.id
            ORDER BY messages.created_at ASC
            ''', 
            [channel_id]
        )
        
        message_list = []
        
        if messages:
            message_list = [{
                "id": msg['id'],
                "text": msg['text'],
                "replies": msg['replies'],
                "author": msg['author'],
                "timestamp": msg['timestamp']
            } for msg in messages]
        
        return jsonify({"messages": message_list})
    
    except sqlite3.Error as e:
        return jsonify({"error": "Error getting messages", "details": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

@app.route('/api/channel/<int:channel_id>/messages', methods=['POST'])
def post_message(channel_id):
    data = request.get_json()
    api_key = data.get('api_key')
    body = data.get('body')

    if not api_key or not body:
        return jsonify({"error": "API key and message body are required."}), 400

    # Validate user via API key
    user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({"error": "Invalid API key."}), 401

    try:
        # Insert the new message
        query_db(
            '''
            INSERT INTO messages (user_id, channel_id, body, created_at)
            VALUES (?, ?, ?, ?)
            ''',
            [user['id'], channel_id, body, datetime.datetime.now(datetime.timezone.utc).isoformat()]
        )
        return jsonify({"message": "Message posted successfully."}), 201

    except sqlite3.Error as e:
        return jsonify({"error": "Error posting message", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

@app.route('/api/messages/<int:message_id>/replies', methods=['GET'])
def get_replies(message_id):
    api_key = request.args.get('api_key')

    if not api_key:
        return jsonify({"error": "API key is required."}), 400

    user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({"error": "Invalid API key."}), 401

    try:
        # Fetch replies for the given message
        replies = query_db(
            '''
            SELECT messages.id, messages.body, messages.created_at, users.name AS author
            FROM messages
            JOIN users ON messages.user_id = users.id
            WHERE messages.replies_to = ?
            ORDER BY messages.created_at ASC
            ''',
            [message_id]
        )
        
        replies_list = []
        
        if replies:
            # Format the replies into a list of dictionaries
            replies_list = [
                {
                    "id": reply["id"],
                    "message_id": message_id,
                    "text": reply["body"],
                    "author": reply["author"],
                    "timestamp": reply["created_at"]
                }
                for reply in replies
            ]

        return jsonify({"replies": replies_list}), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Error fetching replies", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

@app.route('/api/messages/<int:message_id>/replies', methods=['POST'])
def post_reply(message_id):
    data = request.get_json()
    api_key = data.get('api_key')
    body = data.get('body')

    # Validate API key
    if not api_key:
        return jsonify({"error": "API key is required."}), 400

    user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({"error": "Invalid API key."}), 401

    # Validate input
    if not body:
        return jsonify({"error": "Reply body is required."}), 400

    try:
        # Ensure the parent message exists
        parent_message = query_db(
            'SELECT * FROM messages WHERE id = ?', 
            [message_id], 
            one=True
        )
        if not parent_message:
            return jsonify({"error": "Parent message does not exist."}), 404

        # Insert the reply into the database
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        query_db(
            '''
            INSERT INTO messages (user_id, channel_id, body, replies_to, created_at) 
            VALUES (?, ?, ?, ?, ?)
            ''',
            [user["id"], parent_message["channel_id"], body, message_id, timestamp]
        )

        return jsonify({"message": "Reply posted successfully.", "timestamp": timestamp}), 201

    except sqlite3.Error as e:
        return jsonify({"error": "Error posting reply", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500
    
@app.route('/api/messages/<int:message_id>/reactions', methods=['GET'])
def get_reactions(message_id):
    api_key = request.args.get('api_key')

    # Validate API key
    if not api_key:
        return jsonify({"error": "API key is required."}), 400

    user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({"error": "Invalid API key."}), 401

    try:
        # Ensure the message exists
        message = query_db('SELECT * FROM messages WHERE id = ?', [message_id], one=True)
        if not message:
            return jsonify({"error": "Message does not exist."}), 404

        # Fetch all reactions for the message
        reactions = query_db(
            '''
            SELECT reactions.id, reactions.emoji, users.name AS author
            FROM reactions
            JOIN users ON reactions.user_id = users.id
            WHERE reactions.message_id = ?
            ''',
            [message_id]
        )
        
        reactions_list = []
        
        if reactions:
            # Format the response
            reactions_list = [
                {"id": reaction["id"], "emoji": reaction["emoji"], "author": reaction["author"]}
                for reaction in reactions
            ]

        return jsonify({"message": "Reactions fetched successfully.", "reactions": reactions_list}), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Error fetching reactions", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

    

@app.route('/api/messages/<int:message_id>/reactions', methods=['POST'])
def post_reaction(message_id):
    data = request.get_json()
    api_key = data.get('api_key')
    emoji = data.get('emoji')

    # Validate API key
    if not api_key:
        return jsonify({"error": "API key is required."}), 400

    user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({"error": "Invalid API key."}), 401

    # Validate emoji input
    if not emoji:
        return jsonify({"error": "Emoji is required."}), 400

    try:
        # Ensure the message exists
        message = query_db('SELECT * FROM messages WHERE id = ?', [message_id], one=True)
        if not message:
            return jsonify({"error": "Message does not exist."}), 404

        # Insert or update the reaction in the database
        query_db(
            '''
            INSERT INTO reactions (user_id, message_id, emoji) 
            VALUES (?, ?, ?)
            ON CONFLICT (message_id, user_id, emoji) DO UPDATE SET emoji = excluded.emoji
            ''',
            [user['id'], message_id, emoji]
        )

        return jsonify({"message": "Reaction added/updated successfully."}), 200

    except sqlite3.IntegrityError:
        return jsonify({"error": "Failed to add reaction. Ensure the emoji is unique per message and user."}), 400
    except sqlite3.Error as e:
        return jsonify({"error": "Error posting reaction", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

@app.route('/api/user/channels/unread_counts', methods=['GET'])
def get_unread_counts():
    api_key = request.args.get('api_key')

    # Validate API key
    if not api_key:
        return jsonify({"error": "API key is required."}), 400

    # Retrieve the user associated with the provided API key
    user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({"error": "Invalid API key."}), 401

    try:
        # Query to get unread message counts for each channel
        unread_counts = query_db(
            '''
            SELECT 
                c.id AS channel_id,
                c.name AS channel_name,
                COUNT(m.id) AS unread_count
            FROM channels c
            LEFT JOIN messages m ON c.id = m.channel_id
            LEFT JOIN userChannelLastRead uc ON uc.channel_id = c.id AND uc.user_id = ?
            WHERE m.id > IFNULL(uc.last_read_message_id, 0) OR uc.last_read_message_id IS NULL
            GROUP BY c.id, c.name
            ''',
            [user["id"]]
        )
        
        unread_counts_list = []
        
        if unread_counts:
            unread_counts_list = [{
                "channel_id": row["channel_id"],
                "channel_name": row["channel_name"],
                "unread_count": row["unread_count"]
            } for row in unread_counts]

        return jsonify({"unread_counts": unread_counts_list}), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Error fetching unread message counts", "details": str(e)}), 500

@app.route('/api/user/channels/<int:channel_id>/last_read', methods=['POST'])
def update_last_read(channel_id):
    data = request.get_json()
    api_key = data.get('api_key')
    last_read_message_id = data.get('last_read_message_id')

    # Validate API key
    if not api_key:
        return jsonify({"error": "API key is required."}), 400

    # Retrieve the user associated with the provided API key
    user = query_db('SELECT * FROM users WHERE api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({"error": "Invalid API key."}), 401

    # Validate the message ID (last read message ID) is provided in the request
    if not last_read_message_id:
        return jsonify({"error": "last_read_message_id is required."}), 400

    try:
        # Check if the channel exists
        channel_exists = query_db('SELECT * FROM channels WHERE id = ?', [channel_id], one=True)
        if not channel_exists:
            return jsonify({"error": "Channel does not exist."}), 404

        # Update or insert the last read message ID for the user and channel
        query_db(
            '''
            INSERT INTO userChannelLastRead (user_id, channel_id, last_read_message_id)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, channel_id) 
            DO UPDATE SET last_read_message_id = excluded.last_read_message_id
            ''',
            [user["id"], channel_id, last_read_message_id]
        )

        return jsonify({"message": "Last read message updated successfully."}), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Error updating last read message", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(port=8000)
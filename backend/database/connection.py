import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("MONGO_DB_NAME", "pronunciation_db")

client = None
db = None

def get_db():
    global client, db
    if db is not None:
        return db

    try:
        # Establish connection with a short timeout to prevent hanging
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        # Check connection status
        client.admin.command('ping')
        db = client[DB_NAME]
        print(f"Successfully connected to MongoDB at {MONGO_URI}, using database: {DB_NAME}")
        return db
    except ConnectionFailure as e:
        print(f"Warning: Failed to connect to MongoDB: {e}")
        print("Falling back to simulated database memory/JSON operations.")
        return None
    except Exception as e:
        print(f"Warning: Unexpected database connection error: {e}")
        return None

def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")

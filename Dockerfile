FROM python:3.9-slim

# Install system dependencies

RUN apt-get update && apt-get install -y --no-install-recommends 
ffmpeg 
git 
build-essential 
&& rm -rf /var/lib/apt/lists/*

# Set working directory

WORKDIR /app

# Copy requirements file

COPY requirements.txt .

# Upgrade pip and install build tools

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install CPU version of PyTorch

RUN pip install --no-cache-dir torch==2.2.1 
--extra-index-url https://download.pytorch.org/whl/cpu

# Install Python dependencies

RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code

COPY backend/ ./backend/

# Expose FastAPI port

EXPOSE 8000

# Start application

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

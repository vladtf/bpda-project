
# Use the official Python image as the base
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install pipenv
RUN pip install --upgrade pip pipenv

# Copy Pipfile and Pipfile.lock
COPY Pipfile Pipfile.lock /app/

# Install dependencies
RUN pipenv install --deploy --ignore-pipfile

# Copy project
COPY . /app/

# Expose port 5000
EXPOSE 5000

# Define the default command
CMD ["pipenv", "run", "python", "main.py"]
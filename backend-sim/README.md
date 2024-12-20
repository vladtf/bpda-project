# Backend Simulation Project

This project is a backend simulation for an election system using Flask. It provides various endpoints to manage elections, candidates, voters, and disputes.

## Features

- Register and manage elections
- Register and manage candidates
- Check voter eligibility
- Sign candidates
- Vote for candidates
- End elections and view results
- Handle disputes

## Requirements

- Docker
- Docker Compose
- Pipenv (for local development)

## How to Start

### Using Docker

1. **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd backend-sim
    ```

2. **Build and run the Docker container:**
    ```sh
    docker build -t backend-sim .
    docker run -p 5000:5000 backend-sim
    ```

3. **Access the application:**
    Open your browser and navigate to `http://127.0.0.1:5000`.

### Using Pipenv Locally

1. **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd backend-sim
    ```

2. **Install dependencies:**
    ```sh
    pipenv install
    ```

3. **Activate the virtual environment:**
    ```sh
    pipenv shell
    ```

4. **Run the application:**
    ```sh
    python main.py
    ```

5. **Access the application:**
    Open your browser and navigate to `http://127.0.0.1:5000`.

## API Endpoints

- `POST /eligibility_check`
- `POST /register_election`
- `POST /register_candidate`
- `POST /sign_candidate`
- `POST /vote`
- `POST /end_election`
- `GET /results`
- `POST /dispute`
- `POST /resolve_dispute`
- `GET /elections`
- `GET /candidates`
- `POST /validate_candidate`
- `GET /voters`
- `GET /disputes`

For detailed information on each endpoint, refer to the source code in `main.py`.

## License

This project is licensed under the MIT License.

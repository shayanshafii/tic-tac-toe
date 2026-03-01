from http.server import BaseHTTPRequestHandler
import json

WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
]


def check_winner(board):
    for a, b, c in WIN_LINES:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    return None


def minimax(board, is_maximizing):
    winner = check_winner(board)
    if winner == "O":
        return 1
    if winner == "X":
        return -1
    if "" not in board:
        return 0

    if is_maximizing:
        best = -2
        for i in range(9):
            if board[i] == "":
                board[i] = "O"
                best = max(best, minimax(board, False))
                board[i] = ""
        return best
    else:
        best = 2
        for i in range(9):
            if board[i] == "":
                board[i] = "X"
                best = min(best, minimax(board, True))
                board[i] = ""
        return best


def get_best_move(board):
    best_score = -2
    best_index = -1
    for i in range(9):
        if board[i] == "":
            board[i] = "O"
            score = minimax(board, False)
            board[i] = ""
            if score > best_score:
                best_score = score
                best_index = i
    return best_index


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body)
            board = data.get("board", [])

            if len(board) != 9:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid board"}).encode())
                return

            index = get_best_move(board)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"index": index}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

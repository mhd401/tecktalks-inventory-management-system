from enum import Enum

class SessionStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class UserRole(str, Enum):
    ADMIN = "admin"
    CASHIER = "cashier"
    
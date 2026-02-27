from enum import Enum

class SessionStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class UserRole(str, Enum):
    ADMIN = "admin"
    CASHIER = "cashier"


class CashMoveType(str, Enum):
    IN = "IN"
    OUT = "OUT"


class OrderStatus(str, Enum):
    OPEN = "OPEN"
    PAID = "PAID"
    VOID = "VOID"


class PaymentMethod(str, Enum):
    CASH = "CASH"

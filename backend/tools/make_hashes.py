from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

passwords = {
    "admin": "admin123",
    "cashier1": "cashier123",
    "cashier2": "cashier123",
}

for user, pw in passwords.items():
    print(user, "=>", pwd_context.hash(pw))
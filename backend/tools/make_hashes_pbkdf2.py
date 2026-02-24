from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

for pw in ["admin123", "cashier123"]:
    print(pw, "=>", pwd_context.hash(pw))
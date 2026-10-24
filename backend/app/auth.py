from datetime import datetime, timedelta, timezone
import sqlite3
import jwt
from .errors import DomainError
from pwdlib import PasswordHash
from .schemas import UserOut

password_hasher = PasswordHash.recommended()
# Equal-cost verification when an email does not exist reduces account enumeration.
dummy_hash = password_hasher.hash("not-a-real-user-password")


class AuthService:
    def __init__(self, database, secret):
        if len(secret.encode()) < 32:
            raise ValueError("JWT_SECRET must contain at least 32 bytes")
        self.database = database
        self.secret = secret

    def register(self, credentials):
        try:
            user = self.database.add_user(credentials.email, password_hasher.hash(credentials.password))
        except sqlite3.IntegrityError:
            raise DomainError(409, "Email already registered") from None
        return self.session(user)

    def login(self, credentials):
        user = self.database.user_by_email(credentials.email)
        valid = password_hasher.verify(credentials.password, user["password_hash"] if user else dummy_hash)
        if not valid or user is None:
            raise DomainError(401, "Invalid email or password")
        return self.session(user)

    def session(self, user):
        now = datetime.now(timezone.utc)
        token = jwt.encode({"sub": str(user["id"]), "iat": now, "exp": now + timedelta(hours=1)}, self.secret, algorithm="HS256")
        return {"access_token": token, "token_type": "bearer", "user": UserOut(**dict(user))}

    def authenticate(self, token):
        try:
            claims = jwt.decode(token, self.secret, algorithms=["HS256"], options={"require": ["sub", "exp", "iat"]})
            user = self.database.user_by_id(int(claims["sub"]))
        except (jwt.InvalidTokenError, ValueError, TypeError, OverflowError):
            user = None
        if user is None:
            raise DomainError(401, "Invalid or expired token")
        return UserOut(**dict(user))

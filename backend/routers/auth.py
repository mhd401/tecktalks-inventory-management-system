from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from database import get_db
from models.user import User
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse, MeResponse
from core.security import hash_password, verify_password, create_access_token
from core.auth_deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=MeResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    password = payload.password.strip()

    if not email:
        raise HTTPException(status_code=400, detail="Email cannot be empty")
    if not password:
        raise HTTPException(status_code=400, detail="Password cannot be empty")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=email,
        role=payload.role,
        hashed_password=hash_password(password),
    )
    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Failed to register user")

    return user


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # In Swagger OAuth2 popup, "username" field will contain the email
    email = form_data.username.strip().lower()
    password = form_data.password.strip()

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)

    token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=role_value,
    )
    return TokenResponse(access_token=token)

@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
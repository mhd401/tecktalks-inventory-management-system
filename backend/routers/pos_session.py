from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from core.enums import SessionStatus
from models.pos import POS
from models.session import POSSession
from schemas.session import POSSessionRead

router = APIRouter(prefix="/pos", tags=["POS Sessions"])


@router.post("/{pos_id}/session/open", response_model=POSSessionRead)
def open_pos_session(pos_id: int, db: Session = Depends(get_db)):
    pos = db.query(POS).filter(POS.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="POS not found")

    open_session = (
        db.query(POSSession)
        .filter(POSSession.pos_id == pos_id, POSSession.status == SessionStatus.OPEN)
        .first()
    )
    if open_session:
        raise HTTPException(status_code=400, detail="POS session is already open")

    session = POSSession(
        pos_id=pos_id,
        status=SessionStatus.OPEN,
        opened_at=datetime.now(),
    )
    db.add(session)

    try:
        db.commit()
        db.refresh(session)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Failed to open POS session")

    return session


@router.post("/{pos_id}/session/close", response_model=POSSessionRead)
def close_pos_session(pos_id: int, db: Session = Depends(get_db)):
    pos = db.query(POS).filter(POS.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="POS not found")

    open_session = (
        db.query(POSSession)
        .filter(POSSession.pos_id == pos_id, POSSession.status == SessionStatus.OPEN)
        .order_by(POSSession.id.desc())
        .first()
    )
    if not open_session:
        raise HTTPException(status_code=400, detail="No open session found")

    open_session.status = SessionStatus.CLOSED
    open_session.closed_at = datetime.now()

    try:
        db.commit()
        db.refresh(open_session)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Failed to close POS session")

    return open_session


# ✅ This replaces origin/dev's in-memory GET endpoint with a DB-backed one
@router.get("/{pos_id}/session", response_model=POSSessionRead)
def get_latest_session(pos_id: int, db: Session = Depends(get_db)):
    # optional: ensure POS exists (consistent behavior)
    pos = db.query(POS).filter(POS.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="POS not found")

    latest = (
        db.query(POSSession)
        .filter(POSSession.pos_id == pos_id)
        .order_by(POSSession.id.desc())
        .first()
    )
    if not latest:
        raise HTTPException(status_code=404, detail="No session found for this POS")

    return latest


@router.get("/{pos_id}/sessions", response_model=List[POSSessionRead])
def list_pos_sessions(pos_id: int, db: Session = Depends(get_db)):
    return (
        db.query(POSSession)
        .filter(POSSession.pos_id == pos_id)
        .order_by(POSSession.id.desc())
        .all()
    )
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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
        opened_at=datetime.now()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
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
    db.commit()
    db.refresh(open_session)
    return open_session

@router.get("/{pos_id}/sessions", response_model=list[POSSessionRead])
def list_pos_sessions(pos_id: int, db: Session = Depends(get_db)):
    return (
        db.query(POSSession)
        .filter(POSSession.pos_id == pos_id)
        .order_by(POSSession.id.desc())
        .all()
    )
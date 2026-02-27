from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from core.auth_deps import get_current_user
from models.user import User
from core.enums import SessionStatus
from models.pos import POS
from models.session import POSSession
from schemas.session import POSSessionRead

router = APIRouter(prefix="/pos", tags=["POS Sessions"])


@router.post("/{pos_id}/session/open", response_model=POSSessionRead)
def open_pos_session(pos_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    created_session_id: int | None = None

    try:
        with db.begin():
            # Lock POS row to avoid concurrent opens on same POS
            pos = (
                db.query(POS)
                .filter(POS.id == pos_id)
                .with_for_update()
                .first()
            )
            if not pos:
                raise HTTPException(status_code=404, detail="POS not found")

            # Lock existing open session rows (if any)
            open_session = (
                db.query(POSSession)
                .filter(POSSession.pos_id == pos_id, POSSession.status == SessionStatus.OPEN)
                .with_for_update()
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
            db.flush()  # get generated ID before transaction ends
            created_session_id = session.id

        created = db.query(POSSession).filter(POSSession.id == created_session_id).first()
        return created

    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Failed to open POS session")


@router.post("/{pos_id}/session/close", response_model=POSSessionRead)
def close_pos_session(pos_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    closed_session_id: int | None = None

    try:
        with db.begin():
            # Lock POS row to avoid concurrent close/open races
            pos = (
                db.query(POS)
                .filter(POS.id == pos_id)
                .with_for_update()
                .first()
            )
            if not pos:
                raise HTTPException(status_code=404, detail="POS not found")

            open_session = (
                db.query(POSSession)
                .filter(POSSession.pos_id == pos_id, POSSession.status == SessionStatus.OPEN)
                .order_by(POSSession.id.desc())
                .with_for_update()
                .first()
            )
            if not open_session:
                raise HTTPException(status_code=400, detail="No open session found")

            open_session.status = SessionStatus.CLOSED
            open_session.closed_at = datetime.now()
            db.flush()
            closed_session_id = open_session.id

        updated = db.query(POSSession).filter(POSSession.id == closed_session_id).first()
        return updated

    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Failed to close POS session")


@router.get("/{pos_id}/session", response_model=POSSessionRead)
def get_latest_session(pos_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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
def list_pos_sessions(pos_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return (
        db.query(POSSession)
        .filter(POSSession.pos_id == pos_id)
        .order_by(POSSession.id.desc())
        .all()
    )
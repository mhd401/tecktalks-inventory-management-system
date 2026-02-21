from fastapi import APIRouter, HTTPException
from typing import List

from schemas.session import POSSession, SessionStatus, POSSessionResponse

router = APIRouter(
    prefix="/pos",
    tags=["POS Sessions"]
)

sessions: List[POSSession] = []


@router.post("/{pos_id}/session/open", response_model=POSSessionResponse)
def open_session(pos_id: int):
    for session in sessions:
        if session.pos_id == pos_id and session.status == SessionStatus.OPEN:
            raise HTTPException(
                status_code=400,
                detail="An open session already exists for this POS"
            )

    new_session = POSSession(
        id=len(sessions) + 1,
        pos_id=pos_id,
        status=SessionStatus.OPEN
    )

    sessions.append(new_session)

    return {
        "message": f"POS session opened successfully for POS {pos_id}",
        "session": new_session
    }


@router.post("/{pos_id}/session/close", response_model=POSSessionResponse)
def close_session(pos_id: int):
    for session in sessions:
        if session.pos_id == pos_id and session.status == SessionStatus.OPEN:
            session.status = SessionStatus.CLOSED

            return {
                "message": f"POS session closed successfully for POS {pos_id}",
                "session": session
            }

    raise HTTPException(
        status_code=404,
        detail="No open session found for this POS"
    )


@router.get("/{pos_id}/session", response_model=POSSessionResponse)
def get_session(pos_id: int):
    for session in reversed(sessions):
        if session.pos_id == pos_id:
            return {"message": "Session fetched", "session": session}
    raise HTTPException(status_code=404, detail="No session found for this POS")


from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_active_admin
from app.models.user import User
from app.models.time_entry import TimeEntry
from app.schemas.time_entry import (
    TimeEntryCreate,
    TimeEntryResponse,
    ClockStatusResponse,
)

router = APIRouter(prefix="/timesheet", tags=["Fichajes"])


@router.get("/status", response_model=ClockStatusResponse)
def get_current_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve si el usuario actual está trabajando (fichado) y los datos de la sesión abierta."""
    active_entry = (
        db.query(TimeEntry)
        .filter(TimeEntry.user_id == current_user.id, TimeEntry.clock_out.is_(None))
        .first()
    )
    return ClockStatusResponse(
        is_clocked_in=active_entry is not None,
        current_entry=active_entry,
    )


@router.post("/clock-in", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
def clock_in(
    entry_in: Optional[TimeEntryCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra la entrada de la jornada laboral."""
    # Verificar si ya tiene una jornada abierta sin cerrar
    active_entry = (
        db.query(TimeEntry)
        .filter(TimeEntry.user_id == current_user.id, TimeEntry.clock_out.is_(None))
        .first()
    )
    if active_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya tienes una jornada de trabajo abierta. Debes fichar la salida antes de iniciar una nueva.",
        )

    note = entry_in.note if entry_in else None
    new_entry = TimeEntry(
        user_id=current_user.id,
        clock_in=datetime.now(timezone.utc),
        note=note,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.post("/clock-out", response_model=TimeEntryResponse)
def clock_out(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra la salida y calcula las horas totales trabajadas."""
    active_entry = (
        db.query(TimeEntry)
        .filter(TimeEntry.user_id == current_user.id, TimeEntry.clock_out.is_(None))
        .first()
    )
    if not active_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tienes ninguna jornada abierta actualmente para fichar salida.",
        )

    out_time = datetime.now(timezone.utc)
    active_entry.clock_out = out_time

    # Asegurar compatibilidad de zona horaria al restar
    in_time = active_entry.clock_in
    if in_time.tzinfo is None:
        in_time = in_time.replace(tzinfo=timezone.utc)

    # Calcular diferencia en segundos y convertir a horas (con 2 decimales)
    duration_seconds = (out_time - in_time).total_seconds()
    active_entry.total_hours = round(max(duration_seconds / 3600.0, 0.0), 2)

    db.commit()
    db.refresh(active_entry)
    return active_entry


@router.get("/me", response_model=List[TimeEntryResponse])
def get_my_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene el historial de fichajes del usuario autenticado."""
    entries = (
        db.query(TimeEntry)
        .filter(TimeEntry.user_id == current_user.id)
        .order_by(TimeEntry.clock_in.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return entries


@router.get("/admin/all", response_model=List[TimeEntryResponse])
def get_all_entries_admin(
    user_id: Optional[int] = Query(None, description="Filtrar por ID de empleado"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_active_admin),
):
    """[Solo Administradores] Lista los fichajes de toda la empresa o de un usuario en específico."""
    query = db.query(TimeEntry)
    if user_id:
        query = query.filter(TimeEntry.user_id == user_id)

    entries = query.order_by(TimeEntry.clock_in.desc()).offset(skip).limit(limit).all()
    return entries
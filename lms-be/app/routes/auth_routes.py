from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserCreate, UserLogin, Token, UserResponse, ChangePasswordRequest, UpdateOwnProfileRequest, ChangeEmailRequest, UpdateOwnProfileFullRequest
from app import crud, auth
from app.models import User

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (admin only)."""
    # Check if user already exists
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create user
    db_user = crud.create_user(db=db, user=user)
    return db_user

@router.post("/login", response_model=Token)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token."""
    user = auth.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(auth.get_current_user)):
    """Get current user information."""
    return current_user

@router.get("/profile", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(auth.get_current_user)):
    """Get current user profile (alias for /me)."""
    return current_user

@router.post("/logout")
async def logout():
    """Logout endpoint (token invalidation would be handled client-side)."""
    return {"message": "Successfully logged out"}

@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    """Change password for the currently authenticated user."""
    # Verify current password
    if not auth.verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update to new password
    current_user.password_hash = auth.get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="password_changed",
        description=f"User {current_user.name} changed their password",
        details={"user_id": current_user.id}
    )
    
    return {"message": "Password changed successfully"}

@router.put("/profile", response_model=UserResponse)
def update_own_profile(profile_update: UpdateOwnProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    """Update current user's own name."""
    # Update name
    current_user.name = profile_update.name
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="profile_updated",
        description=f"User updated their name to: {current_user.name}",
        details={"user_id": current_user.id, "new_name": current_user.name}
    )
    
    return current_user

@router.post("/change-email")
def change_email(payload: ChangeEmailRequest, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    """Change email for the currently authenticated user."""
    # Verify password for security
    if not auth.verify_password(payload.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect"
        )
    
    # Check if new email is already in use
    existing_user = crud.get_user_by_email(db, email=payload.new_email)
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already in use by another account"
        )
    
    # Check if new email is same as current
    if payload.new_email.lower() == current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email is the same as current email"
        )
    
    # Store old email for logging
    old_email = current_user.email
    
    # Update email
    current_user.email = payload.new_email.lower()
    db.add(current_user)
    db.commit()
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="email_changed",
        description=f"User changed email from {old_email} to {current_user.email}",
        details={"user_id": current_user.id, "old_email": old_email, "new_email": current_user.email}
    )
    
    return {"message": "Email changed successfully", "new_email": current_user.email}

@router.patch("/profile/full", response_model=UserResponse)
def update_own_profile_full(profile_update: UpdateOwnProfileFullRequest, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    """Update current user's own profile data (name, email, department, gender).
    
    This endpoint allows users (both employees and admins) to update their own profile information.
    If changing email, password is required for verification.
    """
    updates = {}
    old_values = {}
    
    # Update name if provided
    if profile_update.name is not None:
        old_values['name'] = current_user.name
        current_user.name = profile_update.name
        updates['name'] = profile_update.name
    
    # Update email if provided
    if profile_update.email is not None:
        # Require password for email change
        if not profile_update.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required to change email"
            )
        
        # Verify password
        if not auth.verify_password(profile_update.password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is incorrect"
            )
        
        # Check if new email is already in use
        existing_user = crud.get_user_by_email(db, email=profile_update.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use by another account"
            )
        
        # Check if new email is same as current
        if profile_update.email.lower() != current_user.email.lower():
            old_values['email'] = current_user.email
            current_user.email = profile_update.email.lower()
            updates['email'] = profile_update.email.lower()
    
    # Update department if provided
    if profile_update.department is not None:
        old_values['department'] = current_user.department
        current_user.department = profile_update.department
        updates['department'] = profile_update.department
    
    # Update gender if provided
    if profile_update.gender is not None:
        old_values['gender'] = current_user.gender.value if current_user.gender else None
        current_user.gender = profile_update.gender
        updates['gender'] = profile_update.gender.value
        
        # Update gender-specific leave balances if gender changed
        if 'gender' in old_values and old_values['gender'] != profile_update.gender.value:
            if profile_update.gender.value == "female":
                current_user.maternity_leave = 90
                current_user.paternity_leave = 0
            elif profile_update.gender.value == "male":
                current_user.maternity_leave = 0
                current_user.paternity_leave = 15
            else:
                current_user.maternity_leave = 0
                current_user.paternity_leave = 0
    
    # If no updates provided
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Save changes
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="profile_updated_full",
        description=f"User {current_user.name} updated their profile",
        details={
            "user_id": current_user.id,
            "updates": updates,
            "old_values": old_values
        }
    )
    
    return current_user

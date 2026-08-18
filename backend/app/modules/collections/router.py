from fastapi import APIRouter, Depends, HTTPException, status  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from sqlalchemy import func
from typing import List

from app.api.dependencies import get_current_user
from app.core.responses import success_response
from app.db import get_db
from app.modules.collections.model import CollectionDB
from app.modules.collections.schema import CollectionCreate, CollectionDetailResponse, CollectionResponse, RecipeInCollectionsResponse
from app.modules.collections.service import CollectionService
from app.modules.users.model import UserDB

router = APIRouter(tags=["Collection Management"])

# 1. API TẠO BỘ SƯU TẬP MỚI (POST /api/collections)
@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_new_collection(
    collection_in: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    if not collection_in.name or not collection_in.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên bộ sưu tập không được để trống hoặc chỉ chứa khoảng trắng"
        )
        
    existing_col = db.query(CollectionDB).filter(
        CollectionDB.user_id == current_user.id,
        func.lower(CollectionDB.name) == collection_in.name.strip().lower()
    ).first()
    if existing_col:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bộ sưu tập với tên này đã tồn tại"
        )

    try:
        return CollectionService.create_collection(db=db, user_id=current_user.id, collection_in=collection_in)
    except Exception as e:
        print(f"❌ Lỗi khi tạo bộ sưu tập: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể tạo bộ sưu tập"
        )


# 2. API LẤY DANH SÁCH BỘ SƯU TẬP CỦA BẢN THÂN (GET /api/collections)
@router.get("", response_model=List[CollectionResponse])
@router.get("/", response_model=List[CollectionResponse], include_in_schema=False)
def list_user_collections(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        return CollectionService.get_user_collections(db=db, user_id=current_user.id)
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách bộ sưu tập: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể tải danh sách bộ sưu tập"
        )


# 3. API LẤY TẤT CẢ CÔNG THỨC ĐÃ LƯU TRONG BỘ SƯU TẬP (GET /api/collections/recipes/all)
@router.get("/recipes/all")
def get_all_saved_recipes_in_collections(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        recipes = CollectionService.get_all_recipes_in_collections(db=db, user_id=current_user.id)
        return recipes
    except Exception as e:
        print(f"❌ Lỗi khi lấy danh sách món ăn: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể tải danh sách món ăn"
        )


# 4. API LẤY DANH SÁCH BỘ SƯU TẬP CHỨA CÔNG THỨC NÀY (GET /api/collections/by-recipe/{recipe_id})
@router.get("/by-recipe/{recipe_id}", response_model=RecipeInCollectionsResponse)
def get_collections_containing_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    col_ids = CollectionService.get_collection_ids_for_recipe(db=db, user_id=current_user.id, recipe_id=recipe_id)
    if col_ids is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy công thức món ăn này"
        )
    return {"recipe_id": recipe_id, "collection_ids": col_ids}


# 5. API LẤY CHI TIẾT BỘ SƯU TẬP (GET /api/collections/{collection_id})
@router.get("/{collection_id}", response_model=CollectionDetailResponse)
def get_collection_detail(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    col_detail = CollectionService.get_collection_detail(db=db, collection_id=collection_id, user_id=current_user.id)
    if not col_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bộ sưu tập"
        )
    return col_detail


# 6. API XÓA BỘ SƯU TẬP (DELETE /api/collections/{collection_id})
@router.delete("/{collection_id}", status_code=status.HTTP_200_OK)
def delete_user_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    success = CollectionService.delete_collection(db=db, collection_id=collection_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bộ sưu tập để xóa"
        )
    return {"message": "Đã xóa bộ sưu tập thành công"}


# 7. API THÊM CÔNG THỨC VÀO BỘ SƯU TẬP (POST /api/collections/{collection_id}/recipes/{recipe_id})
@router.post("/{collection_id}/recipes/{recipe_id}", status_code=status.HTTP_200_OK)
def add_recipe_to_user_collection(
    collection_id: int,
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    assoc = CollectionService.add_recipe_to_collection(
        db=db,
        collection_id=collection_id,
        recipe_id=recipe_id,
        user_id=current_user.id
    )
    if not assoc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể thêm công thức vào bộ sưu tập (bộ sưu tập hoặc món ăn không hợp lệ)"
        )
    return {"message": "Đã thêm món ăn vào bộ sưu tập"}


# 8. API XÓA CÔNG THỨC KHỎI BỘ SƯU TẬP (DELETE /api/collections/{collection_id}/recipes/{recipe_id})
@router.delete("/{collection_id}/recipes/{recipe_id}", status_code=status.HTTP_200_OK)
def remove_recipe_from_user_collection(
    collection_id: int,
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    success = CollectionService.remove_recipe_from_collection(
        db=db,
        collection_id=collection_id,
        recipe_id=recipe_id,
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Món ăn không có trong bộ sưu tập này"
        )
    return {"message": "Đã xóa món ăn khỏi bộ sưu tập"}
